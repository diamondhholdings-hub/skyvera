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

    // Tab navigation - buttons on desktop, select dropdown on mobile
    // Use the select element as primary since it's always visible
    this.overviewTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Overview' }))
    this.financialsTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Financials' }))
    this.organizationTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Organization' }))
    this.strategyTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Strategy' }))
    this.competitiveTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Competitive' }))
    this.intelligenceTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Intelligence' }))
    this.actionItemsTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Action Items' }))
    this.retentionTab = page.locator('#tab-select').or(page.getByRole('button', { name: 'Retention Strategy' }))

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

    // TabNavigation renders desktop buttons — wait for nav to hydrate then click
    const button = this.page.getByRole('button', { name: labelMap[tabName] })
    await button.waitFor({ state: 'visible', timeout: 10000 })
    await button.click()
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
    // TabNavigation renders buttons in a <nav> — wait for nav to hydrate
    const nav = this.page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })

    // Each of the 8 tab buttons must be present
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
      await expect(this.page.getByRole('button', { name: label }).first()).toBeVisible({ timeout: 5000 })
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
