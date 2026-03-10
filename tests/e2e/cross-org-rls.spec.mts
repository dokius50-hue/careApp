import { test, expect } from '@playwright/test';
import { signInAs, E2E_EMAIL, E2E_PASSWORD, E2E_EMAIL_B, E2E_PASSWORD_B } from './auth-helper.mts';

test('cross-org RLS: user B sees no data from org A', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await signInAs(pageA, E2E_EMAIL, E2E_PASSWORD);

    await pageA.goto('/income-expenses');
    await pageA.waitForTimeout(500);
    if (await pageA.getByTestId('add-income-btn').isVisible().catch(() => false)) {
      await pageA.getByTestId('add-income-btn').click();
      await pageA.getByLabel(/name/i).first().fill('Org A Income');
      await pageA.getByLabel(/amount/i).first().fill('50');
      await pageA.locator('form').getByRole('button', { name: /save/i }).first().click();
      await pageA.waitForTimeout(1000);
    }

    await signInAs(pageB, E2E_EMAIL_B, E2E_PASSWORD_B);

    await pageB.goto('/');
    await pageB.waitForTimeout(500);
    await expect(pageB.getByTestId('income-entry').filter({ hasText: 'Org A Income' }).first()).not.toBeVisible();

    await pageB.goto('/income-expenses');
    await pageB.waitForTimeout(500);
    await expect(pageB.getByTestId('income-entry').filter({ hasText: 'Org A Income' }).first()).not.toBeVisible();

    await pageB.goto('/bank');
    await pageB.waitForTimeout(500);
    const balanceOrNoAccount = pageB.getByTestId('bank-balance').or(pageB.getByTestId('bank-no-account'));
    await expect(balanceOrNoAccount).toBeVisible();
    const hasBalance = await pageB.getByTestId('bank-balance').isVisible().catch(() => false);
    if (hasBalance) {
      const balanceText = await pageB.getByTestId('bank-balance').textContent();
      expect(balanceText).not.toContain('€100');
    }

    await pageB.goto('/volunteers');
    await pageB.waitForTimeout(500);
    await expect(pageB.getByTestId('volunteer-hours-entry').filter({ hasText: 'Org A' }).first()).not.toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
