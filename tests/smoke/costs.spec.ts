/**
 * Costs Page Smoke Tests
 * Validates the cost page loads, its tabs switch via ?tab=, and the
 * benchmark is labelled as the internal cost model.
 */

import { test, expect } from '@playwright/test'

test.describe('Costs Page Smoke Tests', () => {
  test('Costs page loads with heading and KPI strip', async ({ page }) => {
    await page.goto('/costs')

    await expect(page.getByRole('heading', { level: 1, name: /^Costs$/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Vendor spend', { exact: true })).toBeVisible()
    await expect(page.getByText('Total cost, % of revenue')).toBeVisible()
  })

  test('Vendors tab is the default and shows the vendor table', async ({ page }) => {
    await page.goto('/costs')

    const nav = page.getByRole('navigation', { name: 'Cost sections' })
    await expect(nav.getByRole('link', { name: 'Vendors' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 2, name: 'Vendors' })).toBeVisible()
    await expect(page.locator('table.data-table').first()).toBeVisible()
  })

  test('Business unit filter is kept in the URL', async ({ page }) => {
    await page.goto('/costs?tab=vendors&bu=Kandy')

    const filter = page.getByRole('navigation', { name: 'Business unit filter' })
    await expect(filter.getByRole('link', { name: 'Kandy' })).toHaveAttribute('aria-current', 'page')
  })

  test('Each tab renders', async ({ page }) => {
    const tabs: Array<[string, RegExp]> = [
      ['central', /By service group/],
      ['headcount', /Quarter summary/],
      ['ai', /AI vendors/],
      ['benchmark', /Dollar variance against the model/],
    ]
    for (const [tab, heading] of tabs) {
      await page.goto(`/costs?tab=${tab}`)
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 10000 })
    }
  })

  test('Benchmark says it is the internal cost model, not peers', async ({ page }) => {
    await page.goto('/costs?tab=benchmark')
    await expect(page.getByText(/not a comparison with peer companies/i)).toBeVisible({ timeout: 10000 })
  })

  test('No error messages on load', async ({ page }) => {
    await page.goto('/costs')
    await expect(page.getByRole('heading', { level: 1, name: /^Costs$/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Unable to load costs/i)).toHaveCount(0)
  })
})
