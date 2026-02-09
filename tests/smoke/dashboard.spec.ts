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

    // Verify refresh button exists
    await expect(dashboard.refreshButton).toBeVisible()

    // Click refresh button
    await dashboard.clickRefresh()

    // Wait for page to reload
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Verify page still loads after refresh
    await expect(dashboard.pageTitle).toBeVisible()
  })

  test('Navigation links work', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Test Accounts navigation
    await expect(dashboard.accountsNavLink).toBeVisible()
    await dashboard.clickAccountsNav()

    // Verify navigation worked
    await expect(page).toHaveURL(/\/accounts/)
    await expect(page.getByRole('heading', { name: 'Customer Accounts' })).toBeVisible()
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

    // Verify BU names appear (Cloudsense, Kandy, STL)
    await expect(page.getByText('Cloudsense')).toBeVisible()
    await expect(page.getByText('Kandy')).toBeVisible()
    await expect(page.getByText('STL')).toBeVisible()
  })

  test('Alerts preview displays', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Verify alerts section or text appears
    await expect(page.getByText(/alerts|recent alerts/i).first()).toBeVisible()
  })
})
