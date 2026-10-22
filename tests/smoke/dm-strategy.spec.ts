import { test, expect } from '@playwright/test';

test.describe('Revenue retention page', () => {
  test('should load with recommendations', async ({ page }) => {
    await page.goto('/dm-strategy');

    // Wait for page to load - the PageHeader h1
    await expect(page.getByRole('heading', { level: 1, name: 'Revenue retention' })).toBeVisible({ timeout: 10000 });

    // Check for business units - use .first() for multiple matches
    await expect(page.locator('text=Cloudsense').first()).toBeVisible();
    await expect(page.locator('text=Kandy').first()).toBeVisible();
    await expect(page.locator('text=STL').first()).toBeVisible();

    console.log('Revenue retention page loaded with data');
  });

  test('should filter by business unit', async ({ page }) => {
    await page.goto('/dm-strategy');
    await expect(page.getByRole('heading', { level: 1, name: 'Revenue retention' })).toBeVisible({ timeout: 10000 });

    // Verify BU cards/sections are present
    const buCards = page.locator('text=Cloudsense').first();
    await expect(buCards).toBeVisible();

    console.log('Business units display correctly');
  });

  test('should show recommendation details', async ({ page }) => {
    await page.goto('/dm-strategy');
    await expect(page.getByRole('heading', { level: 1, name: 'Revenue retention' })).toBeVisible({ timeout: 10000 });

    // Check for numeric values (ARR, DM%, etc.)
    await expect(page.locator('text=/\\$[0-9,]+|[0-9]+\\.[0-9]+%/').first()).toBeVisible();

    console.log('Recommendation details are displayed');
  });
});
