import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper.mts';
import { E2E_EMAIL_B } from './auth-helper.mts';

test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page);
  await page.goto('/settings');
  await expect(page.getByTestId('settings-logout-btn')).toBeVisible({ timeout: 10000 });
});

test('add member: UI output and network/console', async ({ page }) => {
  const responseStatuses: { url: string; status: number }[] = [];
  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('supabase') && u.includes('rest')) {
      responseStatuses.push({ url: u.split('?')[0], status: res.status() });
    }
  });

  await page.getByTestId('settings-add-member-input').fill(E2E_EMAIL_B);
  await page.getByTestId('settings-add-member-btn').click();

  await expect(
    page.getByText(/member added/i).or(page.locator('p.text-rose-600'))
  ).toBeVisible({ timeout: 20000 });

  const rpcCalls = responseStatuses.filter((r) => r.url.includes('rpc'));
  expect(rpcCalls.length, 'lookup_user_id_by_email and add_org_member RPCs should be called').toBeGreaterThanOrEqual(2);
  expect(rpcCalls.some((r) => r.status === 200 || r.status === 204), 'RPCs should succeed').toBe(true);
});

test('logout redirects to sign-in', async ({ page }) => {
  await page.getByTestId('settings-logout-btn').click();
  await expect(page.getByText(/sign in/i).first()).toBeVisible({ timeout: 5000 });
});

test('switch org updates UI when two orgs exist', async ({ page }) => {
  const switchSelect = page.getByTestId('settings-switch-org');
  if (!(await switchSelect.isVisible().catch(() => false))) {
    test.skip(true, 'Only one org; cannot test switch');
    return;
  }
  const options = await switchSelect.locator('option').allTextContents();
  if (options.length < 2) {
    test.skip(true, 'Only one org option');
    return;
  }
  const firstOrg = options[0];
  await switchSelect.selectOption({ index: 1 });
  await page.waitForTimeout(500);
  await page.goto('/');
  await expect(page.getByText(/today/i).first()).toBeVisible({ timeout: 5000 });
  await page.goto('/settings');
  await expect(switchSelect).toHaveValue(await switchSelect.locator('option').nth(1).getAttribute('value'));
});

test('members list shows emails and date added', async ({ page }) => {
  await expect(page.getByText(/members with access/i)).toBeVisible();

  const membersList = page.getByTestId('settings-members-list');
  const noMembers = page.getByText(/no other members yet/i);

  if (await noMembers.isVisible()) {
    await expect(membersList).not.toBeVisible();
    return;
  }

  await expect(membersList).toBeVisible();
  const rows = membersList.getByTestId('settings-member-row');
  await expect(rows.first()).toBeVisible({ timeout: 5000 });

  const firstRow = rows.first();
  await expect(firstRow).toContainText(/@/);
  await expect(firstRow).toContainText(/added|aggiunto/i);
});
