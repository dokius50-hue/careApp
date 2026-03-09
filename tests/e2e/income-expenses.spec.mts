import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper.mts';

test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page);
  await page.goto('/income-expenses');
  await expect(page.getByTestId('add-income-btn')).toBeVisible({ timeout: 10000 });
});

test('income and expense appear in lists with euro formatting and export opens overlay', async ({ page }) => {
  const incomeName = `E2E Income ${Date.now()}`;
  const expenseName = `E2E Expense ${Date.now()}`;

  await page.getByTestId('add-income-btn').click();
  await expect(page.getByRole('heading', { name: /add income/i })).toBeVisible();
  await page.getByLabel(/name/i).first().fill(incomeName);
  await page.getByLabel(/amount/i).first().fill('10.50');
  await page.getByRole('button', { name: /save/i }).first().click();
  await page.waitForTimeout(1500);

  await page.getByTestId('add-expense-btn').click();
  await expect(page.getByRole('heading', { name: /add expense/i })).toBeVisible();
  await page.getByLabel(/name/i).first().fill(expenseName);
  await page.getByLabel(/amount/i).first().fill('5.25');
  await page.getByRole('button', { name: /save/i }).first().click();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('income-entry').filter({ hasText: incomeName })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('income-entry').filter({ hasText: '€10.50' })).toBeVisible();
  await expect(page.getByTestId('expense-entry').filter({ hasText: expenseName })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('expense-entry').filter({ hasText: '€5.25' })).toBeVisible();

  await page.getByTestId('income-expenses-export-btn').click();
  await expect(page.getByText('Export Report')).toBeVisible();
});
