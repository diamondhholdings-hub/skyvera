/**
 * Dashboard Page Object Model
 * Encapsulates dashboard page structure and interactions
 */

import { type Page, type Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page

  // Locators
  readonly pageTitle: Locator
  readonly refreshButton: Locator
  readonly accountsNavLink: Locator

  // KPI locators - using text content matching
  readonly totalRevenueKPI: Locator
  readonly netMarginKPI: Locator
  readonly ebitdaKPI: Locator
  readonly headcountKPI: Locator

  // Loading indicators
  readonly loadingSkeletons: Locator

  constructor(page: Page) {
    this.page = page

    // Main elements
    this.pageTitle = page.getByRole('heading', { name: /Executive Intelligence Report/i, level: 1 })
    this.refreshButton = page.getByRole('button', { name: /refresh/i })
    // Icon-based navigation - select by href instead of text
    this.accountsNavLink = page.locator('a[href="/accounts"]')

    // KPI cards - MetricCard uses divs, not headings. Match on label text.
    this.totalRevenueKPI = page.getByText(/Total Revenue.*Q1'26/i)
    this.netMarginKPI = page.getByText(/Net Margin|EBITDA/i).first()
    this.ebitdaKPI = page.getByText(/EBITDA/i).first()
    this.headcountKPI = page.getByText(/ARR.*Annualized|Rule of 40/i).first()

    // Loading skeletons
    this.loadingSkeletons = page.locator('.animate-pulse')
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard')
  }

  /**
   * Click Accounts navigation link
   */
  async clickAccountsNav() {
    await this.accountsNavLink.click()
  }

  /**
   * Click Refresh button
   */
  async clickRefresh() {
    await this.refreshButton.click()
  }

  /**
   * Wait for dashboard data to load (KPIs visible, not loading skeletons)
   */
  async waitForDataLoaded() {
    // Wait for page title
    await expect(this.pageTitle).toBeVisible()

    // Wait for at least one KPI to be visible
    await expect(this.totalRevenueKPI).toBeVisible({ timeout: 15000 })

    // Verify loading skeletons are gone (or wait a bit for data to render)
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })
  }

  /**
   * Verify no error states are visible
   */
  async verifyNoErrors() {
    // Check for common error message patterns
    await expect(this.page.getByText('temporarily unavailable')).not.toBeVisible()
    await expect(this.page.getByText('Unable to load')).not.toBeVisible()
    await expect(this.page.getByText('error', { exact: false })).not.toBeVisible()
  }
}
