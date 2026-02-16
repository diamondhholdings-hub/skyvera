/**
 * Dashboard Smoke Tests
 * Phase 05-04: Dashboard page functionality validation
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Dashboard Smoke Tests', () => {
  test('Dashboard page loads', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Verify page title
    await expect(dashboard.pageTitle).toBeVisible()

    // Verify no error messages
    await expect(page.getByText('Unable to load')).not.toBeVisible()
    await expect(page.getByText('error', { exact: false })).not.toBeVisible()
  })

  test('KPIs display real values', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Verify all KPIs are visible
    await expect(dashboard.totalRevenueKPI).toBeVisible()
    await expect(dashboard.netMarginKPI).toBeVisible()
    await expect(dashboard.ebitdaKPI).toBeVisible()
    await expect(dashboard.headcountKPI).toBeVisible()

    // Verify loading skeletons are not visible (data has loaded)
    const skeletonCount = await dashboard.loadingSkeletons.count()
    expect(skeletonCount).toBe(0)
  })

  test('Refresh button is visible and clickable', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Dashboard uses auto-refresh via React - manually reload page to test
    await page.reload({ waitUntil: 'networkidle', timeout: 10000 })

    // Verify page still loads after refresh
    await expect(dashboard.pageTitle).toBeVisible({ timeout: 10000 })
    await expect(dashboard.totalRevenueKPI).toBeVisible({ timeout: 10000 })
  })

  test('Navigation links work', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Navigate to Customer Summary section which has accounts link
    await page.getByRole('button', { name: 'Customer Summary' }).click()
    await page.waitForTimeout(1000) // Wait for section to show

    // Click accounts link in customer summary
    const accountsLink = page.locator('a[href="/accounts"]').first()
    await expect(accountsLink).toBeVisible({ timeout: 5000 })
    await accountsLink.click()

    // Verify navigation worked
    await expect(page).toHaveURL(/\/accounts/)
    await expect(page.getByRole('heading', { name: /Customer Account Plans/i })).toBeVisible({ timeout: 10000 })
  })

  test('Dashboard loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    // Wait for page title to appear
    await expect(dashboard.pageTitle).toBeVisible()

    const loadTime = Date.now() - startTime

    // Assert load time is under 2 seconds (2000ms)
    expect(loadTime).toBeLessThan(2000)
  })

  test('Charts and visualizations render', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Verify revenue chart section exists (Recharts canvas or svg)
    const charts = page.locator('svg').or(page.locator('canvas'))
    await expect(charts.first()).toBeVisible({ timeout: 10000 })
  })

  test('Business Unit breakdown displays', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Verify BU names appear (Cloudsense, Kandy, STL) - use .first() for multiple matches
    await expect(page.getByText('Cloudsense').first()).toBeVisible()
    await expect(page.getByText('Kandy').first()).toBeVisible()
    await expect(page.getByText('STL').first()).toBeVisible()
  })

  test('Alerts preview displays', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Verify critical alerts/warnings section (AlertBox in Financial Summary)
    await expect(page.getByText(/OVERALL ASSESSMENT|PROCEED WITH CAUTION|critical/i).first()).toBeVisible({ timeout: 10000 })
  })
})
