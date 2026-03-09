import type { Page } from '@playwright/test';

/** Primary E2E test account – used for in-app feature tests. */
const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? 'dokius50@gmail.com';
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'password';

/** Second E2E test account – used for cross-org RLS test (User B). */
const E2E_EMAIL_B = process.env.E2E_USER_EMAIL_B ?? 'dokius49@gmail.com';
const E2E_PASSWORD_B = process.env.E2E_USER_PASSWORD_B ?? 'password';

export { E2E_EMAIL, E2E_PASSWORD, E2E_EMAIL_B, E2E_PASSWORD_B };

/**
 * Signs in with the E2E test account and waits until the main app (home) is visible.
 * Use in beforeEach for specs that test features inside the app.
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('body').waitFor({ state: 'visible' });

  const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    await page.getByLabel(/email/i).waitFor({ state: 'visible', timeout: 3000 });
    await page.getByLabel(/email/i).fill(E2E_EMAIL);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.locator('form').getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(4000);
  }

  const createOrgHeading = page.getByText(/create organisation|organisation name/i);
  if (await createOrgHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByLabel(/organisation name/i).fill('E2E Test Org');
    await page.getByLabel(/current bank balance|opening/i).fill('0');
    await page.getByRole('button', { name: /create organisation/i }).click();
    await page.waitForTimeout(3000);
  }

  await page.getByText(/today/i).first().waitFor({ state: 'visible', timeout: 20000 });
}

/**
 * Signs in with the given credentials and waits for the main app (home).
 * Use for cross-org tests where two different users are needed.
 */
export async function signInAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await page.locator('body').waitFor({ state: 'visible' });

  const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    await page.getByLabel(/email/i).waitFor({ state: 'visible', timeout: 3000 });
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.locator('form').getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(4000);
  }

  const createOrgHeading = page.getByText(/create organisation|organisation name/i);
  if (await createOrgHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByLabel(/organisation name/i).fill('E2E Test Org');
    await page.getByLabel(/current bank balance|opening/i).fill('0');
    await page.getByRole('button', { name: /create organisation/i }).click();
    await page.waitForTimeout(3000);
  }

  await page.getByText(/today/i).first().waitFor({ state: 'visible', timeout: 20000 });
}
