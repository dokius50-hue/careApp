import { test, expect } from '@playwright/test';

test('manifest URL returns 200 and valid JSON with display standalone', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('name', 'CaritasApp');
  expect(body).toHaveProperty('short_name', 'Caritas');
  expect(body).toHaveProperty('display', 'standalone');
  expect(body).toHaveProperty('theme_color');
  expect(body).toHaveProperty('background_color');
  expect(body).toHaveProperty('icons');
});
