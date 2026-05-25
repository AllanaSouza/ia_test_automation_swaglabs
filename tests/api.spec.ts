import { test, expect } from '@playwright/test';

test.describe('Sauce Demo API flows', () => {
  test('homepage should return 200 and include the SPA shell', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('<div id="root"></div>');
    expect(body).toContain('<title>Swag Labs</title>');
    expect(body).toContain('manifest.json');
  });

  test('direct inventory route should return 404 without browser routing', async ({ request }) => {
    const response = await request.get('/inventory.html');
    expect(response.status()).toBe(404);
  });
});
