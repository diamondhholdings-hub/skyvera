/**
 * Accounts Page Object Model
 * Encapsulates accounts list page structure and interactions
 */

import { type Page, type Locator, expect } from '@playwright/test'

export class AccountsPage {
  readonly page: Page

  // Locators
  readonly pageTitle: Locator
  readonly searchInput: Locator
  readonly accountTable: Locator
  readonly firstAccountRow: Locator
  readonly refreshButton: Locator

  // Stats locators
  readonly totalAccountsCount: Locator
  readonly healthyAccountsCount: Locator

  constructor(page: Page) {
    this.page = page

    // Main elements
    this.pageTitle = page.getByRole('heading', { name: /Customer Account Plans/i, level: 1 })
    this.refreshButton = page.getByRole('button', { name: /refresh/i })

    // Search/filter input - using placeholder text or role
    this.searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).first()

    // Table elements - AccountTable renders cards with className="account-card"
    this.accountTable = page.locator('.account-card').first()

    // First account card (Link renders as <a class="account-card">)
    this.firstAccountRow = page.locator('a.account-card').first()

    // Stats - match actual component text
    this.totalAccountsCount = page.getByText(/Total Customers/i)
    this.healthyAccountsCount = page.getByText(/Healthy Accounts/i)
  }

  /**
   * Navigate to accounts page
   */
  async goto() {
    await this.page.goto('/accounts')
  }

  /**
   * Search for account by name
   */
  async searchByName(name: string) {
    await this.searchInput.fill(name)
    // Wait for table to update
    await this.page.waitForTimeout(500) // Debounce time
  }

  /**
   * Click first account card (clicks the entire card which is a link)
   */
  async clickFirstAccount() {
    // Click the first card (it's entirely a link now)
    await this.firstAccountRow.click()
  }

  /**
   * Wait for accounts table to load
   */
  async waitForTableLoaded() {
    // Wait for page title
    await expect(this.pageTitle).toBeVisible()

    // Wait for table to be visible
    await expect(this.accountTable).toBeVisible({ timeout: 10000 })

    // Wait for at least one account row
    await expect(this.firstAccountRow).toBeVisible({ timeout: 10000 })
  }

  /**
   * Get number of visible account cards
   */
  async getAccountRowCount(): Promise<number> {
    return await this.page.locator('a.account-card').count()
  }

  /**
   * Verify no error states are visible
   */
  async verifyNoErrors() {
    await expect(this.page.getByText('Unable to load customer data')).not.toBeVisible()
    await expect(this.page.getByText('Unable to load statistics')).not.toBeVisible()
  }
}
