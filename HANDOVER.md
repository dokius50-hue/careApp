# CaritasApp – Handover / Pick-up Guide

Use this when resuming work on the project.

---

## Quick start

```bash
cd /Users/xcodeclub/Documents/careApp
cp .env.example .env   # if needed, then fill in keys
npm install
npm run dev
```

Open **http://localhost:5173**. Sign in with a Supabase user; create or switch org as needed.

---

## Environment

Create `.env` in the project root (do not commit it):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get both from Supabase Dashboard → Project Settings → API.

---

## What’s implemented (current state)

- **Home:** Dashboard with today, balance, net cash, volunteer hours; clickable cards to Bank / Income & expenses / Volunteers; **Generate report** opens export overlay.
- **Income & expenses:** Add/edit/delete income and expense entries; display as “D Mon”; export overlay with date range + section checkboxes + aggregation (All entries / By month / By item).
- **Bank:** Add/edit/delete transactions; display dates as “D Mon”; month headers as “Short month Year”; export overlay.
- **Volunteers:** Add/edit/delete hours; display dates as “D Mon”; “By volunteer” in export; export overlay.
- **Export overlay (report):**
  - Date range (From / To).
  - Sections: Income summary, Expense summary, Income entries, Expense entries, Bank summary, Bank transactions, Volunteer hours summary, Hours by volunteer – each with tickbox; entries-type sections have dropdown: **All entries**, **By month**, **By item** (Hours by volunteer shows “By volunteer” for item).
  - **Generate PDF** uses `react-to-print`.
  - **Send by email:** field + button; calls Supabase Edge Function `send-report-email` (sends via Resend). Frontend sends `Authorization: Bearer <anon key>` so the Supabase gateway accepts the request (no 401). If Resend is misconfigured you get 502 and the UI shows the error.
- **i18n:** `src/i18n/en.json` (and minimal `it.json`). New UI strings added there.
- **Delete:** Edit flows for bank tx, income/expense, volunteer hours have a **Delete** button (label from `common.delete`).

---

## Supabase Edge Function: send-report-email

- **Role:** Receives `{ to, payload }`, renders a short HTML report, sends it via Resend to `to`.
- **Auth:** Gateway expects `Authorization: Bearer <anon key>` (or valid user JWT). No custom auth inside the function.
- **Config:** In Supabase Dashboard → Edge Functions → `send-report-email`:
  - **Verify JWT** = OFF (so anon key works).
  - Secrets: `RESEND_API_KEY` (from Resend).
- **From address:** Currently `reports@caritasapp.local`. Resend returns 403 until the domain is verified. To fix:
  - **Option A:** In the function, set `from: 'onboarding@resend.dev'`, redeploy → emails send from Resend’s test sender.
  - **Option B:** In Resend add and verify your domain, then set `from: 'reports@yourdomain.com'` in the function and redeploy.
- **Redeploy after code/secret changes:**
  ```bash
  npx supabase functions deploy send-report-email --project-ref nnaqadncxiciwwbwurcm
  ```
  (Requires `npx supabase login` once.)

---

## Testing the email path from the terminal

```bash
ANON="your-anon-key-from-.env"
curl -s -X POST "https://nnaqadncxiciwwbwurcm.supabase.co/functions/v1/send-report-email" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $ANON" \
  -d '{"to":"you@example.com","payload":{"orgName":"Test","dateFrom":"2025-01-01","dateTo":"2025-01-31","generatedAt":"2025-01-31 12:00","reportData":{}}}'
```

- 401 → auth/headers or JWT verification still on.
- 502 with Resend message → auth OK; fix `from` domain or use `onboarding@resend.dev`.

---

## Debug / console noise

- `debugLog` POSTs to `http://127.0.0.1:7393/...` and logs `ERR_CONNECTION_REFUSED` if nothing is listening. Safe to ignore or disable that call in dev.

---

## Repo and docs

- **Main app/docs:** `README_caritasApp.md` (principles, schema, pages, export overlay, i18n, PWA).
- **Handover:** this file (`HANDOVER.md`).

To commit and push:

```bash
git add -A
git status   # ensure .env is not staged
git commit -m "Handover: export email (Resend), report sections, date display, delete on edit"
git push
```
