/**
 * E2E Demo Flow Test
 * Phase 05-04: Critical demo walkthrough validation
 *
 * Tests the complete executive demo path:
 * Dashboard -> Accounts -> Account Plan -> Multiple Tabs
 *
 * Uses real API calls (no mocks) per CONTEXT.md requirement
 */

import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'
import { AccountsPage } from '../pages/accounts.page'
import { AccountPlanPage } from '../pages/account-plan.page'

test.describe('Demo Flow E2E', () => {
  test('Complete demo walkthrough', async ({ page }) => {
    // Step 1: Dashboard loads with KPIs visible
    const dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForDataLoaded()

    // Verify page title
    await expect(dashboard.pageTitle).toBeVisible()

    // Verify KPIs are visible (data loaded, not skeletons)
    await expect(dashboard.totalRevenueKPI).toBeVisible()
    await expect(dashboard.netMarginKPI).toBeVisible()
    await expect(dashboard.ebitdaKPI).toBeVisible()

    // Verify no error states
    await expect(page.getByText('temporarily unavailable')).not.toBeVisible()
    await expect(page.getByText('Unable to load')).not.toBeVisible()

    // Verify Refresh button is visible
    await expect(dashboard.refreshButton).toBeVisible()

    // Step 2: Navigate to Accounts
    await dashboard.clickAccountsNav()
    const accounts = new AccountsPage(page)
    await accounts.waitForTableLoaded()

    // Verify accounts page loaded
    await expect(accounts.pageTitle).toBeVisible()
    await expect(accounts.accountTable).toBeVisible()

    // Step 3: Search for hero account (British Telecom)
    await accounts.searchByName('British')

    // Verify results appear
    await expect(accounts.firstAccountRow).toBeVisible()

    // Verify search narrowed results (should be fewer than total accounts)
    const rowCount = await accounts.getAccountRowCount()
    expect(rowCount).toBeGreaterThan(0)
    expect(rowCount).toBeLessThan(140) // Should be filtered

    // Step 4: Open account plan
    await accounts.clickFirstAccount()
    const accountPlan = new AccountPlanPage(page)

    // Verify account plan page loaded
    await expect(accountPlan.customerName).toBeVisible()
    await expect(accountPlan.backLink).toBeVisible()

    // Verify all 7 tabs are visible
    await accountPlan.verifyAllTabsVisible()

    // Step 5: Check multiple tabs (Overview is default)
    await expect(accountPlan.overviewTab).toBeVisible()

    // Navigate to Financials tab
    await accountPlan.clickTab('financials')
    await accountPlan.waitForTabContent()
    await expect(page).toHaveURL(/tab=financials/)

    // Navigate to Strategy tab
    await accountPlan.clickTab('strategy')
    await accountPlan.waitForTabContent()
    await expect(page).toHaveURL(/tab=strategy/)

    // Navigate to Intelligence tab (Claude API call - longer timeout)
    await accountPlan.clickTab('intelligence')
    await accountPlan.waitForTabContent()
    await expect(page).toHaveURL(/tab=intelligence/)

    // Verify intelligence tab loaded (should show intelligence report or news)
    await expect(page.getByText(/intelligence|news|insights/i).first()).toBeVisible({ timeout: 20000 })

    // Step 6: Navigate back to dashboard
    await page.goto('/dashboard')
    await dashboard.waitForDataLoaded()

    // Verify dashboard still works
    await expect(dashboard.pageTitle).toBeVisible()
    await expect(dashboard.refreshButton).toBeVisible()
  })

  test('Demo flow passes 3 consecutive times', async ({ page }) => {
    // Run the core demo flow 3 times to validate stability
    for (let run = 1; run <= 3; run++) {
      await test.step(`Run ${run}/3`, async () => {
        // Dashboard
        const dashboard = new DashboardPage(page)
        await dashboard.goto()
        await dashboard.waitForDataLoaded()
        await expect(dashboard.pageTitle).toBeVisible()

        // Navigate to Accounts
        await dashboard.clickAccountsNav()
        const accounts = new AccountsPage(page)
        await accounts.waitForTableLoaded()
        await expect(accounts.pageTitle).toBeVisible()

        // Search for British Telecom
        await accounts.searchByName('British')
        await expect(accounts.firstAccountRow).toBeVisible()

        // Open account plan
        await accounts.clickFirstAccount()
        const accountPlan = new AccountPlanPage(page)
        await expect(accountPlan.customerName).toBeVisible()

        // Verify all tabs are visible
        await accountPlan.verifyAllTabsVisible()

        // Check at least 2 tabs work
        await accountPlan.clickTab('financials')
        await accountPlan.waitForTabContent()
        await expect(page).toHaveURL(/tab=financials/)

        await accountPlan.clickTab('intelligence')
        await accountPlan.waitForTabContent()
        await expect(page).toHaveURL(/tab=intelligence/)
      })
    }
  })
})
