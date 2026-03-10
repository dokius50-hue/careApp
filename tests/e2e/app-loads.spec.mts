import { test, expect } from '@playwright/test';
import { captureConsoleAndNetwork } from './console-helper.mts';

test('app loads without crashing', async ({ page }) => {
  const capture = captureConsoleAndNetwork(page);
  await page.goto('/');

  await expect(page).toHaveTitle(/Shopeto/);
  capture.assertNoRelevantErrors();
});

