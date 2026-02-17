/**
 * Test Utilities for Handling Client-Side Hydration
 *
 * These helpers address common issues with Next.js App Router client components
 * that require hydration before becoming interactive.
 */

import { type Page, type Locator } from '@playwright/test'

/**
 * Wait for a component to be hydrated and interactive
 *
 * Use this when:
 * - Component is wrapped in <Suspense>
 * - Component uses client-side hooks (useSearchParams, useState, etc.)
 * - Test needs to interact with element (click, type, select)
 *
 * @param locator - Playwright locator for the element
 * @param timeout - Maximum wait time in milliseconds (default: 10000)
 */
export async function waitForHydration(locator: Locator, timeout = 10000): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout })
  // Additional small delay to ensure event handlers are attached
  await locator.page().waitForTimeout(100)
}

/**
 * Wait for any of multiple elements to be hydrated (responsive design)
 *
 * Use this when component has different markup for mobile/desktop
 *
 * @param locators - Array of locators to wait for
 * @param timeout - Maximum wait time in milliseconds (default: 10000)
 * @returns The first locator that became visible
 */
export async function waitForAnyHydration(
  locators: Locator[],
  timeout = 10000
): Promise<Locator> {
  await Promise.race(
    locators.map((locator) => locator.waitFor({ state: 'visible', timeout }))
  )

  // Find which one is visible
  for (const locator of locators) {
    const isVisible = await locator.isVisible().catch(() => false)
    if (isVisible) {
      return locator
    }
  }

  throw new Error('None of the provided locators became visible')
}

/**
 * Click an element after ensuring it's hydrated
 *
 * @param locator - Element to click
 * @param timeout - Maximum wait time (default: 10000)
 */
export async function hydratedClick(locator: Locator, timeout = 10000): Promise<void> {
  await waitForHydration(locator, timeout)
  await locator.click()
}

/**
 * Type into an input after ensuring it's hydrated
 *
 * @param locator - Input element
 * @param text - Text to type
 * @param timeout - Maximum wait time (default: 10000)
 */
export async function hydratedFill(
  locator: Locator,
  text: string,
  timeout = 10000
): Promise<void> {
  await waitForHydration(locator, timeout)
  await locator.fill(text)
}

/**
 * Wait for Next.js page navigation to complete including hydration
 *
 * Use after page.goto() or clicking navigation links when the target
 * page has client components that need hydration
 *
 * @param page - Playwright page
 * @param url - Expected URL pattern (optional)
 */
export async function waitForNextJsNavigation(
  page: Page,
  url?: string | RegExp
): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout: 10000 })

  // If URL provided, ensure we're on the right page
  if (url) {
    await page.waitForURL(url, { timeout: 5000 })
  }

  // Small delay for hydration to complete
  await page.waitForTimeout(500)
}

/**
 * Wait for a specific tab panel content to load after tab switch
 *
 * Use after clicking tab navigation when content loads dynamically
 *
 * @param page - Playwright page
 * @param contentSelector - Selector for unique content in the tab
 * @param timeout - Maximum wait time (default: 10000)
 */
export async function waitForTabContent(
  page: Page,
  contentSelector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(contentSelector, { state: 'visible', timeout })
  await page.waitForTimeout(300) // Allow content to stabilize
}
