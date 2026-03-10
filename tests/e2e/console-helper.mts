import { expect } from '@playwright/test';

/**
 * Filters out benign console errors that often occur in E2E (e.g. Supabase/fonts unreachable).
 * Use when asserting "no console errors" so tests pass when only external resource failures occur.
 */
export function filterBenignConsoleErrors(errors: string[]): string[] {
  return errors.filter(
    (msg) =>
      !msg.includes('Failed to load resource') &&
      !msg.includes('ERR_CONNECTION_REFUSED') &&
      !msg.includes('ERR_NAME_NOT_RESOLVED') &&
      !msg.includes('Load failed')
  );
}

/** Benign URL patterns: external resources that may 404 or fail in CI (fonts, analytics, telemetry, etc.) */
const BENIGN_FAILED_URL_PATTERNS = [
  /googleapis\.com/,
  /gstatic\.com/,
  /favicon/,
  /apple-touch-icon/,
  /manifest\.webmanifest/,
  /sw\.js/,
  /workbox/,
  /\/ingest\//,  // Cursor/IDE telemetry
  /127\.0\.0\.1.*ingest/,
];

/**
 * Returns true if the failed request URL should be ignored when asserting "no failed network requests".
 */
export function isBenignFailedRequest(url: string): boolean {
  return BENIGN_FAILED_URL_PATTERNS.some((re) => re.test(url));
}

/**
 * Attach console error and failed-request listeners to the page; call getCaptured() later to assert.
 */
export function captureConsoleAndNetwork(page: import('@playwright/test').Page) {
  const consoleErrors: string[] = [];
  const failedRequests: { url: string; status?: number }[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 500) {
      const url = response.url();
      if (!isBenignFailedRequest(url)) failedRequests.push({ url, status });
    }
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!isBenignFailedRequest(url)) failedRequests.push({ url });
  });
  return {
    getConsoleErrors: () => [...consoleErrors],
    getFailedRequests: () => [...failedRequests],
    assertNoRelevantErrors: () => {
      const relevant = filterBenignConsoleErrors(consoleErrors);
      expect(relevant, `Console errors: ${relevant.join('; ')}`).toHaveLength(0);
      const relevantFailures = failedRequests.filter((f) => !isBenignFailedRequest(f.url));
      expect(
        relevantFailures,
        `Failed requests: ${relevantFailures.map((f) => `${f.url} ${f.status ?? 'failed'}`).join('; ')}`
      ).toHaveLength(0);
    },
  };
}
