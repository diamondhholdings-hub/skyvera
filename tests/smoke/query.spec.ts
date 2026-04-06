/**
 * Query Page Smoke Tests
 * Validates the Natural Language Query page loads correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Query Page Smoke Tests', () => {
  test('Query page loads with correct heading', async ({ page }) => {
    await page.goto('/query')

    // PageHeader renders the title as an h1
    await expect(
      page.getByRole('heading', { name: /Business Intelligence Query/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('Query input is present', async ({ page }) => {
    await page.goto('/query')

    // QueryInput uses aria-label="Natural language query input"
    const input = page.getByLabel(/Natural language query input/i)
    await expect(input).toBeVisible({ timeout: 10000 })
  })

  test('Submit button is present', async ({ page }) => {
    await page.goto('/query')

    // The submit button renders text "Ask" when not loading
    const submitButton = page.getByRole('button', { name: /^ask$/i })
    await expect(submitButton).toBeVisible({ timeout: 10000 })
  })

  test('Query input accepts text', async ({ page }) => {
    await page.goto('/query')

    const input = page.getByLabel(/Natural language query input/i)
    await expect(input).toBeVisible({ timeout: 10000 })

    // Type a query — button should become enabled once >= 3 chars
    await input.fill('What is the total ARR?')
    await expect(input).toHaveValue('What is the total ARR?')

    // Submit button should now be enabled
    const submitButton = page.getByRole('button', { name: /^ask$/i })
    await expect(submitButton).toBeEnabled()
  })

  test('Canned queries section is visible', async ({ page }) => {
    await page.goto('/query')

    // CannedQueries component renders an h2 "Common Questions"
    await expect(
      page.getByRole('heading', { name: /Common Questions/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('No error messages on load', async ({ page }) => {
    await page.goto('/query')

    await expect(page.getByRole('heading', { name: /Business Intelligence Query/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Unable to load')).not.toBeVisible()
    await expect(page.getByText('Error')).not.toBeVisible()
  })
})
