import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo checkout flows', () => {
  test('should complete the checkout successfully', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('button[data-test="add-to-cart-sauce-labs-bike-light"]');

    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    await expect(page).toHaveURL(/checkout-step-one.html/);
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');

    await expect(page).toHaveURL(/checkout-step-two.html/);
    await expect(page.locator('.summary_info')).toContainText('Payment Information');
    await expect(page.locator('.summary_info')).toContainText('Shipping Information');

    await page.click('[data-test="finish"]');
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    await expect(page.locator('.complete-text')).toContainText('Your order has been dispatched');
  });

  test('should cancel checkout and return to the cart page', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    await page.fill('[data-test="firstName"]', 'Jane');
    await page.fill('[data-test="lastName"]', 'Smith');
    await page.fill('[data-test="postalCode"]', '54321');
    await page.click('[data-test="cancel"]');

    await expect(page).toHaveURL(/cart.html/);
    await expect(page.locator('.cart_list')).toContainText('Sauce Labs Backpack');
  });
});
