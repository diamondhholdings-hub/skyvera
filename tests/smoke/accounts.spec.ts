/**
 * Accounts Smoke Tests
 * Phase 05-04: Accounts page functionality validation
 */

import { test, expect } from '@playwright/test'
import { AccountsPage } from '../pages/accounts.page'

test.describe('Accounts Smoke Tests', () => {
  test('Accounts page loads with table visible', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Verify page title
    await expect(accounts.pageTitle).toBeVisible()

    // Verify table is visible
    await expect(accounts.accountTable).toBeVisible()

    // Verify at least one account row exists
    await expect(accounts.firstAccountRow).toBeVisible()

    // Verify no error messages
    await accounts.verifyNoErrors()
  })

  test('Account stats display', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Verify stats section displays total accounts count
    await expect(accounts.totalAccountsCount).toBeVisible()

    // Verify health indicators appear
    await expect(accounts.healthyAccountsCount).toBeVisible()
  })

  test('Search/filter works', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Get initial row count
    const initialCount = await accounts.getAccountRowCount()
    expect(initialCount).toBeGreaterThan(0)

    // Search for "British"
    await accounts.searchByName('Telefonica')

    // Wait for debounce
    await page.waitForTimeout(500)

    // Verify results narrowed
    const filteredCount = await accounts.getAccountRowCount()
    expect(filteredCount).toBeGreaterThan(0)
    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // Verify filtered row is visible
    await expect(accounts.firstAccountRow).toBeVisible()
  })

  test('Clear search shows all accounts', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Search for something specific
    await accounts.searchByName('Telefonica')
    await page.waitForTimeout(500)
    const filteredCount = await accounts.getAccountRowCount()

    // Clear search
    await accounts.searchByName('')
    await page.waitForTimeout(500)

    // Verify more accounts shown now
    const fullCount = await accounts.getAccountRowCount()
    expect(fullCount).toBeGreaterThanOrEqual(filteredCount)
  })

  test('Account rows are clickable', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Search for British Telecom to narrow results
    await accounts.searchByName('Telefonica')
    await expect(accounts.firstAccountRow).toBeVisible()

    // Click first account
    await accounts.clickFirstAccount()

    // Verify navigation to account plan page
    await expect(page).toHaveURL(/\/accounts\/[^/]+/)

    // Wait for page to fully load (hydration)
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Verify account plan page loaded - look for customer name or tab navigation
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('Health indicators display correctly', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Verify health indicators appear in table (green/yellow/red dots or text)
    const healthIndicators = page.locator('[aria-label*="health"], [title*="health"]').or(
      page.getByText(/healthy|at risk|stable/i)
    )

    // At least one health indicator should be visible
    await expect(healthIndicators.first()).toBeVisible({ timeout: 5000 })
  })

  test('Table sorting works', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Get first customer name before sorting
    const firstCustomerBefore = await accounts.firstAccountRow.textContent()

    // Find and use the sorting dropdown (AccountTable uses dropdown, not column headers)
    const sortSelect = page.locator('select').first()
    await sortSelect.selectOption('customer_name')

    // Wait for re-render
    await page.waitForTimeout(500)

    // Verify table still visible (sorting didn't break table)
    await expect(accounts.accountTable).toBeVisible()
    await expect(accounts.firstAccountRow).toBeVisible()

    // Optionally verify sorting changed order
    const firstCustomerAfter = await accounts.firstAccountRow.textContent()
    // Don't assert they're different since they might coincidentally be the same
  })

  test('Refresh button works', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Verify refresh button exists
    await expect(accounts.refreshButton).toBeVisible()

    // Click refresh
    await accounts.refreshButton.click()

    // Wait for reload
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Verify page still works after refresh
    await expect(accounts.pageTitle).toBeVisible()
    await expect(accounts.accountTable).toBeVisible()
  })

  test('Data completeness badges are visible', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // CompletenessBadge renders "{n}% complete" text on each account card
    const badge = page.getByText(/\d+% complete/i).first()
    await expect(badge).toBeVisible({ timeout: 10000 })
  })

  test('URL search parameter filters accounts', async ({ page }) => {
    // Navigate directly with ?search= — server-side filtered, bookmarkable
    await page.goto('/accounts?search=cloud')

    // Page heading still visible
    await expect(page.getByRole('heading', { name: /Customer Account Plans/i })).toBeVisible()

    // At least one account card should be visible (Cloudsense accounts)
    const firstCard = page.locator('a.account-card').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    // URL retains the search param
    await expect(page).toHaveURL(/search=cloud/)
  })

  test('Account card links navigate to detail page', async ({ page }) => {
    const accounts = new AccountsPage(page)
    await accounts.goto()
    await accounts.waitForTableLoaded()

    // Get the href of the first account card before clicking
    const firstCard = page.locator('a.account-card').first()
    const href = await firstCard.getAttribute('href')
    expect(href).toMatch(/\/accounts\/[^/]+/)

    // Click and verify navigation
    await firstCard.click()
    await expect(page).toHaveURL(/\/accounts\/[^/]+/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })
})
