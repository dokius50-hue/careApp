import { test, expect } from '@playwright/test';
import { filterBenignConsoleErrors } from './console-helper.mts';

test('app loads without crashing', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/CaritasApp/);

  const relevant = filterBenignConsoleErrors(consoleErrors);
  expect(relevant, 'No console errors should be logged (excluding benign network errors)').toHaveLength(0);
});

