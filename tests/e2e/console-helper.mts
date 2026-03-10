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
