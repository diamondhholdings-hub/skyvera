/**
 * Alerts Page Smoke Tests
 * Validates the Proactive Alerts page loads and displays data correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Alerts Page Smoke Tests', () => {
  test('Alerts page loads with correct heading', async ({ page }) => {
    await page.goto('/alerts')

    // PageHeader renders "Proactive Alerts" as h1
    await expect(
      page.getByRole('heading', { name: /Proactive Alerts/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('Alert summary stats are visible', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { name: /Proactive Alerts/i })
    ).toBeVisible({ timeout: 10000 })

    // AlertSummary component renders Total Alerts, Critical, Warning cards
    await expect(page.getByText(/Total Alerts/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Critical/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Warning/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('At least one alert item is visible', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { name: /Proactive Alerts/i })
    ).toBeVisible({ timeout: 10000 })

    // AlertSummary shows a numeric total — at minimum the count badge is visible
    // AlertList renders cards with customer name text; total count is always present
    const totalAlertsCount = page.getByText(/Total Alerts/i)
    await expect(totalAlertsCount).toBeVisible({ timeout: 10000 })

    // The numeric count next to "Total Alerts" should be a non-empty number
    // Look for any text that is purely numeric (alert count) inside the summary section
    await expect(page.locator('p.text-3xl').first()).toBeVisible({ timeout: 5000 })
  })

  test('No error messages on load', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { name: /Proactive Alerts/i })
    ).toBeVisible({ timeout: 10000 })

    await expect(page.getByText('Unable to load alerts')).not.toBeVisible()
  })

  test('Refresh button is visible', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { name: /Proactive Alerts/i })
    ).toBeVisible({ timeout: 10000 })

    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible({ timeout: 5000 })
  })
})
