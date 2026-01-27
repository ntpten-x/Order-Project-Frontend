import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Update this to match your actual app title
    await expect(page).toHaveTitle(/Order/);
});

test('redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/pos');
    // Should redirect to login page
    await expect(page.url()).toContain('/auth/login');
});
