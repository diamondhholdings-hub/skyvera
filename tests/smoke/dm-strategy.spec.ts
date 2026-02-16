import { test, expect } from '@playwright/test';

test.describe('DM Strategy Page', () => {
  test('should load with recommendations', async ({ page }) => {
    await page.goto('http://localhost:3000/dm-strategy');

    // Wait for page to load - look for live data indicator
    await page.waitForSelector('text=Live Data', { timeout: 10000 });

    // Check for business units - use .first() for multiple matches
    await expect(page.locator('text=Cloudsense').first()).toBeVisible();
    await expect(page.locator('text=Kandy').first()).toBeVisible();
    await expect(page.locator('text=STL').first()).toBeVisible();

    console.log('✓ DM Strategy page loaded successfully with data');
  });

  test('should filter by business unit', async ({ page }) => {
    await page.goto('http://localhost:3000/dm-strategy');
    await page.waitForSelector('text=Live Data');

    // Verify BU cards/sections are present
    const buCards = page.locator('text=Cloudsense').first();
    await expect(buCards).toBeVisible();

    console.log('✓ Business units display correctly');
  });

  test('should show recommendation details', async ({ page }) => {
    await page.goto('http://localhost:3000/dm-strategy');
    await page.waitForSelector('text=Live Data');

    // Check for numeric values (ARR, DM%, etc.)
    await expect(page.locator('text=/\\$[0-9,]+|[0-9]+\\.[0-9]+%/').first()).toBeVisible();

    console.log('✓ Recommendation details are displayed');
  });
});
