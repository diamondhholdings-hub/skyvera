/**
 * Revenue Risk Page Smoke Tests
 * Renewals, renewal pipeline and receivables over 90 days, all from the
 * intelligence snapshot (no external APIs).
 */

import { test, expect } from '@playwright/test'

const heading = (page: import('@playwright/test').Page) =>
  page.getByRole('heading', { level: 1, name: /^Revenue risk$/i })

test.describe('Revenue Risk Page Smoke Tests', () => {
  test('Page loads with heading and KPI strip', async ({ page }) => {
    await page.goto('/revenue-risk')
    await expect(heading(page)).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(/ARR at risk, next 4 quarters/i)).toBeVisible()
    await expect(page.getByText(/^AR over 90 days$/i).first()).toBeVisible()
    await expect(page.getByText(/Open renewal pipeline ARR/i)).toBeVisible()
    await expect(page.locator('dl dd.num').first()).toHaveText(/^\$[\d.]+[MK]?$/)
  })

  test('Renewals tab is the default and shows both tables', async ({ page }) => {
    await page.goto('/revenue-risk')
    await expect(heading(page)).toBeVisible({ timeout: 10000 })

    const sections = page.getByRole('navigation', { name: 'Revenue risk sections' })
    await expect(sections.getByRole('link', { name: 'Renewals', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { name: 'Renewals by quarter' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'At-risk subscriptions' })).toBeVisible()
  })

  test('Pipeline tab shows stages and opportunities', async ({ page }) => {
    await page.goto('/revenue-risk?tab=pipeline')
    await expect(heading(page)).toBeVisible({ timeout: 10000 })

    await expect(page.getByRole('heading', { name: 'By stage' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Opportunities' })).toBeVisible()
  })

  test('Receivables tab shows customers with expandable notes', async ({ page }) => {
    await page.goto('/revenue-risk?tab=receivables')
    await expect(heading(page)).toBeVisible({ timeout: 10000 })

    await expect(page.getByRole('heading', { name: 'By business unit' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible()
    await expect(page.locator('details.rr-note').first()).toBeVisible()
  })

  test('Business unit filter keeps the tab and marks the active unit', async ({ page }) => {
    await page.goto('/revenue-risk?tab=receivables&bu=Kandy')
    await expect(heading(page)).toBeVisible({ timeout: 10000 })

    const filter = page.getByRole('navigation', { name: 'Business unit' })
    await expect(filter.getByRole('link', { name: 'Kandy', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible()
    await expect(page.getByText(/Kandy/).first()).toBeVisible()
  })

  test('No error messages on load', async ({ page }) => {
    await page.goto('/revenue-risk')
    await expect(heading(page)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Unable to load revenue risk|not available/i)).toHaveCount(0)
  })
})
