import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper.mts';

test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page);
});

test('open export overlay from income-expenses; assert title, date range, sections; Generate PDF no error', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/income-expenses');
  await expect(page.getByTestId('income-expenses-export-btn')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('income-expenses-export-btn').click();

  await expect(page.getByText('Export Report')).toBeVisible();
  await expect(page.getByTestId('export-date-from')).toBeVisible();
  await expect(page.getByTestId('export-date-to')).toBeVisible();
  await expect(page.getByTestId('export-section-incomeEntries')).toBeVisible();
  await expect(page.getByTestId('export-section-expenseEntries')).toBeVisible();

  await page.getByTestId('export-generate-pdf-btn').click();
  await page.waitForTimeout(1000);

  expect(consoleErrors, 'No console errors when generating PDF').toHaveLength(0);
});
