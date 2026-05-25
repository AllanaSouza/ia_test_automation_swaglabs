import { test, expect } from '@playwright/test';

test.describe('Sauce Demo API contract', () => {
  test('manifest.json should follow the expected contract', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const manifest = await response.json();
    expect(manifest).toEqual(expect.objectContaining({
      theme_color: expect.any(String),
      background_color: expect.any(String),
      display: expect.any(String),
      scope: expect.any(String),
      start_url: expect.any(String),
      name: expect.any(String),
      short_name: expect.any(String),
      icons: expect.any(Array),
    }));

    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);

    for (const icon of manifest.icons) {
      expect(icon).toEqual(
        expect.objectContaining({
          src: expect.any(String),
          sizes: expect.any(String),
          type: expect.any(String),
        })
      );
    }
  });
});
