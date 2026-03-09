import { test, expect } from '@playwright/test';

test('app loads without crashing', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/CaritasApp/);

  expect(consoleErrors, 'No console errors should be logged').toHaveLength(0);
});

