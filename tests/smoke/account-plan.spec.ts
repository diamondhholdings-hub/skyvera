/**
 * Account Plan Smoke Tests
 * Phase 05-04: Account plan page functionality validation
 */

import { test, expect } from '@playwright/test'
import { AccountPlanPage } from '../pages/account-plan.page'

// Hero account for testing
const HERO_ACCOUNT = 'British Telecommunications PLC'

test.describe('Account Plan Smoke Tests', () => {
  test('Account plan page loads for hero account', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Verify customer name displays
    await expect(accountPlan.customerName).toBeVisible()
    await expect(accountPlan.customerName).toContainText('British')

    // Verify back link
    await expect(accountPlan.backLink).toBeVisible()

    // Verify no error messages
    await accountPlan.verifyNoErrors()
  })

  test('All 7 tabs are visible', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Wait for page to load
    await expect(accountPlan.customerName).toBeVisible()

    // Verify all 7 tabs
    await accountPlan.verifyAllTabsVisible()
  })

  test('Overview tab loads by default', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Verify overview tab is visible
    await expect(accountPlan.overviewTab).toBeVisible()

    // Verify URL has no tab param or tab=overview
    const url = page.url()
    expect(url).toMatch(/(\?|&)tab=overview|\/accounts\/[^?]*$/)
  })

  test('Tab switching works - Financials', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Click financials tab
    await accountPlan.clickTab('financials')
    await accountPlan.waitForTabContent()

    // Verify URL updated
    await expect(page).toHaveURL(/tab=financials/)

    // Verify financial content appears (ARR, subscription data)
    await expect(page.getByText(/ARR|subscription|revenue/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('Tab switching works - Organization', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Click organization tab
    await accountPlan.clickTab('organization')
    await accountPlan.waitForTabContent()

    // Verify URL updated
    await expect(page).toHaveURL(/tab=organization/)

    // Verify org content appears (stakeholders, org chart)
    await expect(page.getByText(/stakeholder|contact|role/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('Tab switching works - Strategy', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Click strategy tab
    await accountPlan.clickTab('strategy')
    await accountPlan.waitForTabContent()

    // Verify URL updated
    await expect(page).toHaveURL(/tab=strategy/)

    // Verify strategy content (pain points, opportunities)
    await expect(page.getByText(/pain point|opportunity|strategic/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('Tab switching works - Competitive', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Click competitive tab
    await accountPlan.clickTab('competitive')
    await accountPlan.waitForTabContent()

    // Verify URL updated
    await expect(page).toHaveURL(/tab=competitive/)

    // Verify competitive content (competitors, positioning)
    await expect(page.getByText(/competitor|positioning|threat/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('Tab switching works - Intelligence', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Click intelligence tab (Claude API call - longer timeout)
    await accountPlan.clickTab('intelligence')
    await accountPlan.waitForTabContent()

    // Verify URL updated
    await expect(page).toHaveURL(/tab=intelligence/)

    // Verify intelligence content (insights, news, AI analysis)
    await expect(page.getByText(/intelligence|insight|news|analysis/i).first()).toBeVisible({ timeout: 20000 })
  })

  test('Tab switching works - Action Items', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Click action items tab
    await accountPlan.clickTab('action-items')
    await accountPlan.waitForTabContent()

    // Verify URL updated
    await expect(page).toHaveURL(/tab=action-items/)

    // Verify action items content (Kanban board, tasks)
    await expect(page.getByText(/action|task|to do|in progress|done/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('Back link returns to accounts list', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Verify back link exists
    await expect(accountPlan.backLink).toBeVisible()

    // Click back link
    await accountPlan.clickBack()

    // Verify navigation to accounts page
    await expect(page).toHaveURL(/\/accounts$/)
    await expect(page.getByRole('heading', { name: 'Customer Accounts' })).toBeVisible()
  })

  test('Health indicator displays', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Verify health indicator appears (color dot + text)
    const healthIndicator = page.locator('[aria-label*="Health"]').or(
      page.getByText(/healthy|at risk|stable/i)
    )
    await expect(healthIndicator.first()).toBeVisible({ timeout: 5000 })
  })

  test('Business unit badge displays', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)
    await accountPlan.goto(HERO_ACCOUNT)

    // Verify BU badge appears (Cloudsense, Kandy, STL, NewNet)
    const buBadge = page.getByText(/Cloudsense|Kandy|STL|NewNet/i)
    await expect(buBadge.first()).toBeVisible({ timeout: 5000 })
  })

  test('Direct tab URL navigation works', async ({ page }) => {
    const accountPlan = new AccountPlanPage(page)

    // Navigate directly to intelligence tab via URL
    const encodedName = encodeURIComponent(HERO_ACCOUNT)
    await page.goto(`/accounts/${encodedName}?tab=intelligence`)

    // Verify intelligence tab content loads
    await expect(page).toHaveURL(/tab=intelligence/)
    await expect(page.getByText(/intelligence|insight|news/i).first()).toBeVisible({ timeout: 20000 })
  })
})
