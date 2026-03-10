import { test, expect } from '@playwright/test';
import { captureConsoleAndNetwork } from './console-helper.mts';

test('user flow: load app and see auth or main UI', async ({ page }) => {
  const capture = captureConsoleAndNetwork(page);
  await page.goto('/');

  await expect(page).toHaveTitle(/CaritasApp/);
  await expect(page.locator('body')).toBeVisible();
  await expect(
    page.getByText(/loading/i).or(page.getByText(/create organisation|organisation name/i)).or(page.getByText(/today/i)).or(page.getByText('Sign in').first())
  ).toBeVisible({ timeout: 10000 });

  capture.assertNoRelevantErrors();
});

test('user flow: sign up, create org, see home or stay on auth when confirmation required', async ({ page }) => {
  const capture = captureConsoleAndNetwork(page);
  await page.goto('/');

  const signUpBtn = page.getByRole('button', { name: /sign up/i });
  if (await signUpBtn.isVisible()) {
    await signUpBtn.click();
    const email = `e2e-${Date.now()}@example.com`;
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.locator('form').getByRole('button', { name: /sign up/i }).click();
    await page.waitForTimeout(3000);
    // Post-registration welcome: click Continue to proceed
    const continueBtn = page.getByRole('button', { name: /continue/i });
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(1500);
    }
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

  capture.assertNoRelevantErrors();
});

test('auth: forgot password subview shows reset and magic link options', async ({ page }) => {
  const capture = captureConsoleAndNetwork(page);
  await page.goto('/');
  const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
  await expect(signInBtn).toBeVisible({ timeout: 10000 });
  await signInBtn.click();
  await page.getByRole('button', { name: /forgot password/i }).click();
  await expect(page.getByText(/reset or sign in with a link|reimposta o accedi/i)).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole('button', { name: /reset my password|reimposta la mia password/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /send me a one-time|invia un link di accesso/i })).toBeVisible();
  await page.getByRole('button', { name: /back to sign in|torna all'accesso/i }).click();
  await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible();
  capture.assertNoRelevantErrors();
});
