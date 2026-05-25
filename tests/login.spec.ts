import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo login flows', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/inventory.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('should display an error for invalid credentials', async ({ page }) => {
    await login(page, 'invalid_user', 'wrong_password');

    await expect(page.locator('.error-message-container')).toContainText('Username and password do not match any user in this service');
  });

  test('should show locked out message for locked user', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');

    await expect(page.locator('.error-message-container')).toContainText('Sorry, this user has been locked out.');
  });

  test('should logout from inventory and return to login page', async ({ page }) => {
    await login(page);

    await page.click('#react-burger-menu-btn');
    await page.click('#logout_sidebar_link');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-test="username"]')).toBeVisible();
  });
});
