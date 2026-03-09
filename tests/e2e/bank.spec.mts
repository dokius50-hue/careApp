import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper.mts';

test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page);
  await page.goto('/bank');
  await expect(
    page.getByTestId('bank-balance').or(page.getByTestId('bank-no-account'))
  ).toBeVisible({ timeout: 10000 });
});

test('balance visible; add deposit and withdrawal; assert they appear in history', async ({ page }) => {
  const hasNoAccount = await page.getByTestId('bank-no-account').isVisible().catch(() => false);
  if (hasNoAccount) {
    test.skip(true, 'No bank account (create_organisation may not create one)');
    return;
  }

  await expect(page.getByTestId('bank-balance')).toBeVisible();

  await page.getByTestId('bank-deposit-btn').click();
  await expect(page.getByRole('heading', { name: /deposit/i })).toBeVisible();
  await page.getByLabel(/amount/i).first().fill('25.00');
  await page.getByLabel(/note/i).fill('E2E deposit');
  await page.locator('form').getByRole('button', { name: /save/i }).click();
  await page.waitForTimeout(1500);

  await page.getByTestId('bank-withdraw-btn').click();
  await expect(page.getByRole('heading', { name: /withdraw/i })).toBeVisible();
  await page.getByLabel(/amount/i).first().fill('10.50');
  await page.getByLabel(/note/i).fill('E2E withdrawal');
  await page.locator('form').getByRole('button', { name: /save/i }).click();
  await expect(page.getByTestId('bank-tx-deposit').filter({ hasText: '€25.00' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('bank-tx-withdrawal').filter({ hasText: '€10.50' })).toBeVisible();
});
