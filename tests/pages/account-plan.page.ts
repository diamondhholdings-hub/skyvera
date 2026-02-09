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

  // Tab content area
  readonly tabContent: Locator

  constructor(page: Page) {
    this.page = page

    // Header elements
    this.customerName = page.locator('h1').first()
    this.backLink = page.getByRole('link', { name: /back to accounts/i })

    // Tab navigation - using role link or button
    this.overviewTab = page.getByRole('link', { name: /overview/i })
    this.financialsTab = page.getByRole('link', { name: /financials/i })
    this.organizationTab = page.getByRole('link', { name: /organization/i })
    this.strategyTab = page.getByRole('link', { name: /strategy/i })
    this.competitiveTab = page.getByRole('link', { name: /competitive/i })
    this.intelligenceTab = page.getByRole('link', { name: /intelligence/i })
    this.actionItemsTab = page.getByRole('link', { name: /action items/i })

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
   * Click a specific tab by name
   */
  async clickTab(tabName: 'overview' | 'financials' | 'organization' | 'strategy' | 'competitive' | 'intelligence' | 'action-items') {
    switch (tabName) {
      case 'overview':
        await this.overviewTab.click()
        break
      case 'financials':
        await this.financialsTab.click()
        break
      case 'organization':
        await this.organizationTab.click()
        break
      case 'strategy':
        await this.strategyTab.click()
        break
      case 'competitive':
        await this.competitiveTab.click()
        break
      case 'intelligence':
        await this.intelligenceTab.click()
        break
      case 'action-items':
        await this.actionItemsTab.click()
        break
    }
  }

  /**
   * Wait for tab content to load
   */
  async waitForTabContent() {
    // Wait for network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 15000 })

    // Small delay for tab content to render
    await this.page.waitForTimeout(500)
  }

  /**
   * Verify all 7 tabs are visible
   */
  async verifyAllTabsVisible() {
    await expect(this.overviewTab).toBeVisible()
    await expect(this.financialsTab).toBeVisible()
    await expect(this.organizationTab).toBeVisible()
    await expect(this.strategyTab).toBeVisible()
    await expect(this.competitiveTab).toBeVisible()
    await expect(this.intelligenceTab).toBeVisible()
    await expect(this.actionItemsTab).toBeVisible()
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
