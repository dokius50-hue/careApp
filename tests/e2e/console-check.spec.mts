import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const LOG_PATH = '/Users/xcodeclub/Documents/careApp/.cursor/debug-1abaea.log';

test('capture devtools console output for verification', async ({ page }) => {
  const entries: { type: string; text: string }[] = [];

  page.on('console', (msg) => {
    entries.push({ type: msg.type(), text: msg.text() });
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const line = JSON.stringify({
    sessionId: '1abaea',
    location: 'console-check.spec.mts',
    message: 'devtools_console_capture',
    data: { entries },
    timestamp: Date.now(),
    hypothesisId: 'console'
  }) + '\n';
  fs.appendFileSync(LOG_PATH, line);

  const errors = entries.filter((e) => e.type === 'error');
  const hasManifestError = entries.some((e) => e.text.includes('Manifest') && e.text.includes('Syntax error'));
  const hasFavicon404 = entries.some((e) => e.text.includes('favicon.ico') && e.text.includes('404'));
  const hasIconError = entries.some((e) => e.text.includes('icon') && e.text.includes('Manifest'));

  expect(hasManifestError, 'Console must not show Manifest syntax error').toBe(false);
  expect(hasFavicon404, 'Console must not show favicon.ico 404').toBe(false);
  expect(hasIconError, 'Console must not show manifest icon download error').toBe(false);
});
