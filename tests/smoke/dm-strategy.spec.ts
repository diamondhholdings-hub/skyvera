import { test, expect } from '@playwright/test';

test.describe('DM Strategy Page', () => {
  test('should load with recommendations', async ({ page }) => {
    await page.goto('http://localhost:3000/dm-strategy');

    // Wait for page to load
    await page.waitForSelector('text=DM% Strategy & Revenue Retention', { timeout: 10000 });

    // Check for business units
    await expect(page.locator('text=Cloudsense')).toBeVisible();
    await expect(page.locator('text=Kandy')).toBeVisible();
    await expect(page.locator('text=STL')).toBeVisible();

    // Check for recommendations
    await expect(page.locator('text=All Recommendations')).toBeVisible();

    // Check for filters
    await expect(page.locator('text=All')).toBeVisible();
    await expect(page.locator('text=Critical')).toBeVisible();
    await expect(page.locator('text=High Impact')).toBeVisible();

    // Verify at least one recommendation card is visible
    const recommendationCards = page.locator('[data-testid="recommendation-card"], .dm-card');
    await expect(recommendationCards.first()).toBeVisible();

    console.log('✓ DM Strategy page loaded successfully with recommendations');
  });

  test('should filter by business unit', async ({ page }) => {
    await page.goto('http://localhost:3000/dm-strategy');
    await page.waitForSelector('text=DM% Strategy & Revenue Retention');

    // Click on Cloudsense BU card
    await page.locator('text=Cloudsense').click();

    // Should show filtered view
    await expect(page.locator('text=← All Business Units')).toBeVisible();

    console.log('✓ Business unit filtering works');
  });

  test('should show recommendation details', async ({ page }) => {
    await page.goto('http://localhost:3000/dm-strategy');
    await page.waitForSelector('text=DM% Strategy & Revenue Retention');

    // Check for ARR impact values
    await expect(page.locator('text=/\\$[0-9,]+/')).toBeVisible();

    // Check for DM% values
    await expect(page.locator('text=/[0-9]+\\.[0-9]+%/')).toBeVisible();

    console.log('✓ Recommendation details are displayed');
  });
});
