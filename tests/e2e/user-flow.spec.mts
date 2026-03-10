import { test, expect } from '@playwright/test';
import { filterBenignConsoleErrors } from './console-helper.mts';

test('user flow: load app and see auth or main UI', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/CaritasApp/);

  await expect(page.locator('body')).toBeVisible();

  await expect(
    page.getByText(/loading/i).or(page.getByText(/create organisation|organisation name/i)).or(page.getByText(/today/i)).or(page.getByText('Sign in').first())
  ).toBeVisible({ timeout: 10000 });

  const relevant = filterBenignConsoleErrors(consoleErrors);
  expect(relevant, 'No console errors on load (excluding benign network errors)').toHaveLength(0);
});

test('user flow: sign up, create org, see home or stay on auth when confirmation required', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');

  const signUpBtn = page.getByRole('button', { name: /sign up/i });
  if (await signUpBtn.isVisible()) {
    await signUpBtn.click();
    const email = `e2e-${Date.now()}@example.com`;
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.locator('form').getByRole('button', { name: /sign up/i }).click();
    await page.waitForTimeout(3000);
  }

  const createOrgHeading = page.getByText(/create organisation|organisation name/i);
  if (await createOrgHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByLabel(/organisation name/i).fill('E2E Test Org');
    await page.getByLabel(/current bank balance|opening/i).fill('100');
    await page.getByRole('button', { name: /create organisation/i }).click();
    await page.waitForTimeout(3000);
  }

  const homeToday = page.getByText(/today/i).first();
  const reachedHome = await homeToday.isVisible({ timeout: 15000 }).catch(() => false);

  if (reachedHome) {
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  }

  const relevant = filterBenignConsoleErrors(consoleErrors);
  expect(relevant, 'No console errors during user flow (excluding benign network errors)').toHaveLength(0);
});
