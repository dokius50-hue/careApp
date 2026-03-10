import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth-helper.mts';

test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page);
  await page.goto('/volunteers');
  await expect(page.getByTestId('volunteers-add-hours-btn')).toBeVisible({ timeout: 10000 });
});

test('add volunteer and add hours; assert they appear in history and in Add Hours selector', async ({ page }) => {
  const volunteerName = `E2E Volunteer ${Date.now()}`;

  await page.getByTestId('volunteers-manage-btn').click();
  await expect(page.getByRole('heading', { name: /manage volunteers/i })).toBeVisible();
  await page.getByTestId('manage-volunteer-name-input').fill(volunteerName);
  await page.getByTestId('manage-volunteer-add-btn').click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /cancel/i }).first().click();
  await page.waitForTimeout(800);

  await page.getByTestId('volunteers-add-hours-btn').click();
  await expect(page.getByTestId('add-hours-volunteer-select')).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByTestId('add-hours-volunteer-select').selectOption({ label: volunteerName }, { timeout: 10000 });
  await page.getByRole('dialog', { name: 'Add Hours' }).locator('input[name="hours"]').fill('2.5');
  await page.getByRole('dialog', { name: 'Add Hours' }).getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(800);

  const entryWithName = page.getByTestId('volunteer-hours-entry').filter({ hasText: volunteerName });
  await expect(entryWithName).toBeVisible();
  await expect(entryWithName.filter({ hasText: '2.5' })).toBeVisible();

  await page.getByTestId('volunteers-add-hours-btn').click();
  await expect(page.getByTestId('add-hours-volunteer-select')).toBeVisible();
  await page.getByTestId('add-hours-volunteer-select').selectOption({ label: volunteerName });
});
