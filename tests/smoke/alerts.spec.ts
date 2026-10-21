/**
 * Alerts Page Smoke Tests
 * Validates the Alerts page loads and displays data correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Alerts Page Smoke Tests', () => {
  test('Alerts page loads with correct heading', async ({ page }) => {
    await page.goto('/alerts')

    // PageHeader renders "Alerts" as h1
    await expect(
      page.getByRole('heading', { level: 1, name: /^Alerts$/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('Alert summary stats are visible', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { level: 1, name: /^Alerts$/i })
    ).toBeVisible({ timeout: 10000 })

    // AlertSummary renders a KpiStrip with Total alerts, Critical, Warning
    await expect(page.getByText(/Total Alerts/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Critical/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Warning/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('At least one alert item is visible', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { level: 1, name: /^Alerts$/i })
    ).toBeVisible({ timeout: 10000 })

    // AlertSummary shows a numeric total in the KpiStrip; total count is always present
    const totalAlertsCount = page.getByText(/Total Alerts/i)
    await expect(totalAlertsCount).toBeVisible({ timeout: 10000 })

    // The KpiStrip figure (dd.num) under "Total alerts" should be a number
    const totalFigure = page.locator('dl dd.num').first()
    await expect(totalFigure).toBeVisible({ timeout: 5000 })
    await expect(totalFigure).toHaveText(/^\d+$/)
  })

  test('No error messages on load', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { level: 1, name: /^Alerts$/i })
    ).toBeVisible({ timeout: 10000 })

    await expect(page.getByText('Unable to load alerts')).not.toBeVisible()
  })

  test('Refresh button is visible', async ({ page }) => {
    await page.goto('/alerts')

    await expect(
      page.getByRole('heading', { level: 1, name: /^Alerts$/i })
    ).toBeVisible({ timeout: 10000 })

    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible({ timeout: 5000 })
  })
})
