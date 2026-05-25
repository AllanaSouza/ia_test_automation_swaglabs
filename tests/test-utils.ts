import { Page } from '@playwright/test';

export const login = async (page: Page, username = 'standard_user', password = 'secret_sauce') => {
  await page.goto('/');
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
};

export const addAllProductsToCart = async (page: Page) => {
  const buttons = page.locator('.inventory_item button');
  const count = await buttons.count();
  for (let index = 0; index < count; index++) {
    await buttons.nth(index).click();
  }
};
