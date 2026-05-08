/**
 * Account Plan Page Object Model
 * Encapsulates account plan page structure and tab interactions
 */

import { type Page, type Locator, expect } from '@playwright/test'

export class AccountPlanPage {
  readonly page: Page

  // Locators
  readonly customerName: Locator
  readonly backLink: Locator

  // Tab locators
  readonly overviewTab: Locator
  readonly financialsTab: Locator
  readonly organizationTab: Locator
  readonly strategyTab: Locator
  readonly competitiveTab: Locator
  readonly intelligenceTab: Locator
  readonly actionItemsTab: Locator
  readonly retentionTab: Locator

  // Tab content area
  readonly tabContent: Locator

  constructor(page: Page) {
    this.page = page

    // Header elements
    this.customerName = page.locator('h1').first()
    this.backLink = page.getByText(/back to accounts/i)

    // Tab navigation - <a> links on desktop (post-a11y refactor), select dropdown on mobile
    this.overviewTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Overview/i }))
    this.financialsTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Financial/i }))
    this.organizationTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Org Structure/i }))
    this.strategyTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Pain Points/i }))
    this.competitiveTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Competitive/i }))
    this.intelligenceTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Intelligence/i }))
    this.actionItemsTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Action Plan/i }))
    this.retentionTab = page.locator('#tab-select').or(page.getByRole('link', { name: /Action Plan/i }))

    // Tab content container
    this.tabContent = page.locator('main').or(page.locator('[role="tabpanel"]'))
  }

  /**
   * Navigate to account plan page
   */
  async goto(accountName: string) {
    const encodedName = encodeURIComponent(accountName)
    await this.page.goto(`/accounts/${encodedName}`)
  }

  /**
   * Click a specific tab by name (works with both desktop buttons and mobile select)
   */
  async clickTab(tabName: 'overview' | 'financials' | 'organization' | 'strategy' | 'competitive' | 'intelligence' | 'action-items' | 'retention' | 'key-executives' | 'org-structure' | 'pain-points' | 'action-plan') {
    const labelMap: Record<string, string> = {
      'overview': '📊 Overview',
      'financials': '💰 Financial',
      'organization': '🏢 Org Structure',
      'org-structure': '🏢 Org Structure',
      'strategy': '💡 Pain Points',
      'pain-points': '💡 Pain Points',
      'competitive': '⚔️ Competitive',
      'intelligence': '🧠 Intelligence',
      'action-items': '📋 Action Plan',
      'action-plan': '📋 Action Plan',
      'key-executives': '👔 Key Executives',
      'retention': '📋 Action Plan'
    }

    // TabNavigation renders desktop links (post-a11y) — scope to account-section nav so header links don't match
    const visibleText = labelMap[tabName].replace(/^[^\sA-Za-z]+\s*/, '')
    const accountNav = this.page.getByRole('navigation', { name: /account sections/i })
    const link = accountNav.getByRole('link', { name: new RegExp(visibleText, 'i') }).first()
    await link.waitFor({ state: 'visible', timeout: 10000 })
    await link.click()
  }

  /**
   * Wait for tab content to load
   */
  async waitForTabContent() {
    // Wait for URL to update (faster than networkidle)
    await this.page.waitForURL(/tab=/, { timeout: 3000 })

    // Small delay for tab content to render
    await this.page.waitForTimeout(500)
  }

  /**
   * Verify all 8 tabs are accessible as desktop buttons in the nav
   */
  async verifyAllTabsVisible() {
    // TabNavigation renders links in <nav aria-label="Account sections"> — wait for nav to hydrate
    const accountNav = this.page.getByRole('navigation', { name: /account sections/i })
    await expect(accountNav).toBeVisible({ timeout: 10000 })

    // Each of the 8 tab links must be present in the account-section nav
    const tabLabels = [
      /overview/i,
      /key.?exec/i,
      /org.?struct/i,
      /pain.?point/i,
      /competitive/i,
      /action.?plan/i,
      /financial/i,
      /intelligence/i,
    ]
    for (const label of tabLabels) {
      await expect(accountNav.getByRole('link', { name: label }).first()).toBeVisible({ timeout: 5000 })
    }
  }

  /**
   * Click back to accounts link
   */
  async clickBack() {
    await this.backLink.click()
  }

  /**
   * Verify no error states are visible
   */
  async verifyNoErrors() {
    await expect(this.page.getByText('Unable to load account data')).not.toBeVisible()
    await expect(this.page.getByText('Unable to load customer data')).not.toBeVisible()
  }
}
