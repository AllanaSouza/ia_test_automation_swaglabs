import { test, expect } from '@playwright/test';
import { login, addAllProductsToCart } from './test-utils';

test.describe('Sauce Demo cart flows', () => {
  test('should add and remove a product from the cart', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL(/cart.html/);
    await expect(page.locator('.cart_list')).toContainText('Sauce Labs Backpack');

    await page.click('button[data-test="remove-sauce-labs-backpack"]');
    await expect(page.locator('.cart_list')).not.toContainText('Sauce Labs Backpack');
    await expect(page.locator('.shopping_cart_badge')).toBeHidden();
  });

  test('should add all products and display the correct cart count', async ({ page }) => {
    await login(page);
    await addAllProductsToCart(page);

    await expect(page.locator('.shopping_cart_badge')).toHaveText('6');
    await page.click('.shopping_cart_link');
    await expect(page.locator('.cart_item')).toHaveCount(6);
  });
});
