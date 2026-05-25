import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo product flows', () => {
  test('should sort products by name and price', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/inventory.html/);

    const sort = page.locator('[data-test="product-sort-container"]');
    await expect(sort).toBeVisible();

    await sort.selectOption('za');
    await expect(page.locator('.inventory_item_name').first()).toHaveText('Test.allTheThings() T-Shirt (Red)');

    await sort.selectOption('lohi');
    await expect(page.locator('.inventory_item_price').first()).toHaveText('$7.99');
  });

  test('should view product details and navigate back to inventory', async ({ page }) => {
    await login(page);
    await page.click('.inventory_item_name');

    await expect(page).toHaveURL(/inventory-item.html/);
    await expect(page.locator('.inventory_details_name')).toBeVisible();
    await expect(page.locator('.inventory_details_desc')).toBeVisible();

    await page.click('[data-test="back-to-products"]');
    await expect(page).toHaveURL(/inventory.html/);
  });
});
