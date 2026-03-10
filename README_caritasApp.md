# CaritasApp

A mobile-first Progressive Web App for charity shop management. Tracks daily income, expenses, bank transactions, and volunteer hours across one or more organisations. Built for ease of use on a mobile phone browser, with clean A4-printable exports.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Backend / Database / Auth | Supabase |
| Internationalisation | i18next |
| PDF Export | react-to-print |
| PWA | vite-plugin-pwa |

---

## Testing

E2E tests use Playwright and hit the real app (Vite dev server) and Supabase. After changing settings, organisation, or members flows, run:

- **Full suite:** `npm run test:e2e`
- **Settings only (faster):** `npm run test:e2e:settings`

Requires `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, and optionally `E2E_USER_EMAIL_B` / `E2E_USER_PASSWORD_B` for cross-org tests.

---

## Core Principles

- **Mobile-first.** Every screen is designed for a phone screen first. Tappable targets, no tiny text, no horizontal scrolling.
- **Org-centric data.** All data belongs to an organisation, not a user. Users belong to organisations. If a user leaves, all data remains.
- **Soft deletes everywhere.** Nothing is ever permanently deleted from the database. All records have a `deleted_at` timestamp. Queries always filter `WHERE deleted_at IS NULL`.
- **Trust the user.** No automatic reconciliation between the bank ledger and income/expense records. The app records what the user says.
- **i18n from day one.** Every user-facing string must be defined in `src/i18n/en.json`. No hardcoded display strings anywhere in components. A `it.json` file will be added in a later phase.
- **Euro only.** All monetary values are stored and displayed in Euro (€). Amounts are always stored as integers in cents (e.g. €12.50 is stored as `1250`) to avoid floating point errors.

---

## PWA Requirements

- Configure `vite-plugin-pwa` to generate a `manifest.json` and service worker automatically.
- The manifest must include: app name ("CaritasApp"), short name ("Caritas"), theme colour, background colour, and a set of icons at 192×192 and 512×512.
- The app must launch in `standalone` display mode (full screen, no browser chrome).
- The bottom navigation bar must use the CSS variable `env(safe-area-inset-bottom)` as bottom padding so it clears the iPhone home gesture bar. Example:
  ```css
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  ```
- The `<meta name="viewport">` tag must include `viewport-fit=cover`.

---

## Supabase Setup

### Authentication
Use Supabase Auth with email/password. No third-party OAuth needed for now. Email invite links are a Phase 2 feature — for now, a user creates an account and is manually added to an organisation by another admin.

### Row Level Security
**RLS must be enabled on every table without exception.** Before marking any feature as complete, verify it works correctly when logged in as a user who belongs to a *different* organisation — they must see zero data.

The core pattern for every RLS policy is:
```sql
auth.uid() IN (
  SELECT user_id FROM org_members WHERE org_id = [table].org_id
)
```

### Database Schema

```sql
-- Organisations
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Junction table: which users belong to which orgs
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Income entries
CREATE TABLE income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  date DATE NOT NULL,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Expense entries
CREATE TABLE expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  date DATE NOT NULL,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Bank account (one per organisation)
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) UNIQUE,
  opening_balance_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),
  type TEXT CHECK (type IN ('deposit', 'withdrawal')) NOT NULL,
  amount_cents INTEGER NOT NULL,
  note TEXT,
  date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Volunteers
CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Volunteer hours log
CREATE TABLE volunteer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),
  volunteer_id UUID REFERENCES volunteers(id),
  date DATE NOT NULL,
  hours NUMERIC(4,1) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

---

## Organisation Setup Flow

When a user creates a new organisation they must be prompted for:
1. Organisation name
2. Current bank balance (this becomes `opening_balance_cents` on the `bank_accounts` row)

The current bank balance is always computed as:
```
opening_balance_cents + SUM(deposits) - SUM(withdrawals)
```
Never store a running balance — always derive it from transactions.

---

## App Structure

```
src/
  i18n/
    en.json          ← all English strings
    it.json          ← Italian (Phase 2, leave empty placeholder)
  components/
    BottomNav.jsx
    ExportOverlay.jsx
    LineChart.jsx    ← reusable Recharts wrapper
  pages/
    Home.jsx
    IncomeExpenses.jsx
    Bank.jsx
    Volunteers.jsx
    Settings.jsx
  lib/
    supabase.js      ← Supabase client initialisation
  App.jsx
  main.jsx
```

---

## Navigation

A fixed bottom navigation bar is present on all main pages. It must respect iPhone safe-area-inset-bottom (see PWA Requirements above).

| Icon | Destination |
|---|---|
| 🏠 Home | Home page |
| € Euro sign | Income & Expenses page |
| 🏦 Bank/columns icon | Bank Account page |
| 👥 Person/group icon | Volunteers page |
| ⚙️ Widget/grid icon | Settings page |

The active tab must be visually highlighted.

---

## Pages

### Home Page

- **Hero:** Today's date, large and prominent.
- **Revenue chart:** A Recharts line chart showing total daily income for the last 20 days on which at least one income entry exists. X-axis shows dates, Y-axis shows Euro amounts. "Open days" are inferred from the existence of income entries — days with only expenses or no entries do not appear.
- **Top volunteers:** A list of the top 5 volunteers ranked by total hours logged in the last 90 days. Show volunteer name and total hours. Weeks start on Monday.

---

### Income & Expenses Page

- **Revenue chart:** Same line chart as the home page (last 20 income days).
- **Two action buttons side by side:** "Add Income" and "Add Expense". Each opens a modal/sheet with fields: name (text), amount (€), date (defaults to today), tags (free-text, comma-separated, stored as array).
- **Two scrollable lists side by side** below the buttons: recent income entries on the left, recent expense entries on the right. Each item shows: transaction name, date, and amount. Soft-deleted entries never appear.
- **Export button:** Floating in the top-right corner. Uses a download/share icon. Tapping opens the Export Overlay.

---

### Bank Account Page

- **Hero:** Current bank balance, large and prominent. Computed from opening balance + all deposits - all withdrawals.
- **Two action buttons side by side:** "Deposit" and "Withdraw". Each opens a modal/sheet with fields: amount (€), note (optional text), date (defaults to today).
- **Transaction history:** A single scrollable list of all bank transactions in reverse chronological order. Each entry shows a `+` prefix for deposits and `−` prefix for withdrawals, the note, the date, and the amount. A full-width divider line separates different calendar months, with the month/year label on the divider.
- **Export button:** Same pattern as Income & Expenses page.

---

### Volunteers Page

- **Hours chart:** A Recharts line chart showing total volunteer hours per week for the last 5 complete weeks (weeks start Monday).
- **Two action buttons side by side:** "Add Hours" and "Manage Volunteers".
  - "Add Hours" opens a modal to select a volunteer, enter a date (defaults to today), and enter hours worked.
  - "Manage Volunteers" opens a list of all active volunteers with options to add a new volunteer (name only) or mark existing ones as inactive (soft delete).
- **Hours history:** A scrollable list showing each day worked. Within each day, one row per volunteer showing their name and hours. A full-width divider line with the date label separates different days. Most recent day first.
- **Export button:** Same pattern as other pages.

---

### Settings Page

A simple list-style settings page with the following sections:

- **Export settings** — options that affect how exports are generated (details TBD at export build time)
- **Font size** — Small / Medium / Large, applies globally
- **Language** — English only for now. Italian option visible but marked "Coming soon"
- **Organisation**
  - Create new organisation
  - Switch between organisations the current user belongs to (if more than one)
  - Invite user to organisation (Phase 2 — show button, but display "Coming soon" message)
- **Logout**

---

### Export Overlay

- Triggered from the floating export button on Income/Expenses, Bank, and Volunteers pages.
- Slides up as a bottom sheet overlay covering most of the screen (the page underneath remains visible behind a dim backdrop).
- The overlay is context-aware: it knows which page it was opened from and pre-selects relevant data sections.
- **Content of the overlay:**
  - A title: "Export Report"
  - A date range picker: From / To (defaults to current calendar month)
  - A checklist of sections to include, relevant to context. For example from the Income/Expenses page: "Income entries", "Expense entries", "Revenue chart". From the Volunteers page: "Volunteer hours summary", "Hours by volunteer", "Weekly chart".
  - A "Generate PDF" button
- The generated PDF should be clean, A4 portrait, suitable for printing. Include the organisation name, date range, and generation date in a header. Use clear tables for data. Charts can be omitted from the initial implementation — focus on clean tabular data first.
- Use `react-to-print` for PDF generation. Create a hidden printable component that renders the selected sections in A4 format and is triggered by the "Generate PDF" button.

---

## Data & Logic Notes

- **Timezone:** All dates are stored as `DATE` (no time component) in the user's local timezone. Use the browser's local date when defaulting to "today". Do not store UTC timestamps for date-only fields.
- **Amount formatting:** Always display amounts as `€X.XX`. Always store as integer cents. Convert on input and display only.
- **Tags:** Stored as a Postgres `TEXT[]` array. On input, accept comma-separated strings and split on save. Display as small pill/badge elements.
- **Soft deletes:** Every query across the entire app must include `WHERE deleted_at IS NULL`. Consider a Supabase view or PostgREST filter to make this easier.
- **Current organisation context:** Store the user's currently active `org_id` in React context (or Zustand if state gets complex). All queries use this org_id. Switching org in Settings updates this context and re-fetches all data.

---

## Phase 2 Features (Do Not Build Now)

These are explicitly out of scope for the initial build. Do not add complexity to accommodate them — just avoid architecturally blocking them.

- Receipt photo attachments on income/expense entries (Supabase Storage is already available when needed)
- Email-based organisation invitations
- Read-only and data-entry user roles (beyond the current all-admin model)
- Italian language (`it.json`)
- Discrepancy warnings between bank balance and income/expense totals

---

## Definition of Done

Before any feature is considered complete:

1. It works correctly on a mobile screen (375px wide minimum)
2. It is tested while logged in as a user belonging to a **different organisation** — zero data leakage
3. All user-facing strings are in `en.json`, none are hardcoded in components
4. Soft delete filter (`deleted_at IS NULL`) is applied to all relevant queries
5. The bottom nav safe-area padding is intact and correct on iOS Safari
