import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/POS/i);
});

test('pos page is reachable', async ({ page }) => {
    await page.goto('/pos');
    await expect(page).toHaveURL(/\/pos/);
});
