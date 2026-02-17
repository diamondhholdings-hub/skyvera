# Test Suite Documentation

## Overview

This directory contains E2E (End-to-End) tests for the Skyvera Intelligence Platform using Playwright.

**Current Status:** 34/34 tests passing (100%)

## Test Structure

```
tests/
├── e2e/                      # Full user journey tests
│   └── demo-flow.spec.ts     # Complete demo walkthrough
├── smoke/                    # Quick smoke tests per feature
│   ├── dashboard.spec.ts     # Dashboard functionality
│   ├── accounts.spec.ts      # Accounts listing
│   ├── account-plan.spec.ts  # Individual account plans
│   └── dm-strategy.spec.ts   # DM Strategy page
├── pages/                    # Page Object Model
│   ├── dashboard.page.ts
│   ├── accounts.page.ts
│   └── account-plan.page.ts
└── utils/                    # Test utilities
    ├── hydration-helpers.ts  # Handle client-side hydration
    └── test-data-fixtures.ts # Consistent test data
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/smoke/dashboard.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

## Best Practices

### 1. Handling Client-Side Hydration

**Problem:** Next.js App Router client components wrapped in `<Suspense>` require hydration before they're interactive.

**Solution:** Use hydration helpers from `utils/hydration-helpers.ts`:

```typescript
import { hydratedClick, waitForNextJsNavigation } from '../utils/hydration-helpers'

// Wait for navigation + hydration
await waitForNextJsNavigation(page, /\/accounts\/[^/]+/)

// Click after ensuring hydration
await hydratedClick(page.getByRole('button', { name: 'Financials' }))
```

### 2. Responsive Design Testing

When components have different markup for mobile/desktop:

```typescript
import { waitForAnyHydration } from '../utils/hydration-helpers'

const desktopButton = page.getByRole('button', { name: 'Tab Name' })
const mobileSelect = page.locator('#tab-select')

// Wait for either to appear
const visibleElement = await waitForAnyHydration([desktopButton, mobileSelect])
```

### 3. Using Test Fixtures

For consistent test data:

```typescript
import { TEST_CUSTOMERS, EXPECTED_TABS } from '../utils/test-data-fixtures'

// Use predefined customer data
await accounts.searchByName(TEST_CUSTOMERS.BRITISH_TELECOM.name)

// Validate expected tabs
for (const tabName of EXPECTED_TABS) {
  await expect(page.getByRole('button', { name: tabName })).toBeVisible()
}
```

### 4. Timeouts

Use consistent timeouts from fixtures:

```typescript
import { TIMEOUTS } from '../utils/test-data-fixtures'

await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.networkIdle })
await page.waitForSelector('.content', { timeout: TIMEOUTS.content })
```

### 5. Avoiding Flaky Tests

Common causes of flaky tests and solutions:

| Problem | Solution |
|---------|----------|
| Element not interactive | Use `hydratedClick()` instead of `click()` |
| Multiple elements match | Use `.first()` or more specific selectors |
| Race conditions | Use `waitFor()` with proper state checks |
| Network timing | Use `networkidle` load state |
| Animations | Add small delays after transitions |

### 6. Debugging Failed Tests

When a test fails:

1. **Check the trace:**
   ```bash
   npx playwright show-report
   ```
   Opens HTML report with traces, screenshots, and videos

2. **Run in headed mode:**
   ```bash
   npx playwright test --headed --debug tests/path/to/spec.ts
   ```

3. **Use Playwright Inspector:**
   ```bash
   npx playwright test --debug
   ```

4. **Check test artifacts:**
   - Screenshots: `test-results/[test-name]/test-failed-1.png`
   - Videos: `test-results/[test-name]/video.webm`
   - Traces: `test-results/[test-name]/trace.zip`

## Page Object Model

All page interactions should go through page objects for maintainability:

```typescript
// ✅ GOOD - Using page object
const accounts = new AccountsPage(page)
await accounts.goto()
await accounts.searchByName('British')

// ❌ BAD - Direct page interaction
await page.goto('/accounts')
await page.locator('input').fill('British')
```

### Creating New Page Objects

1. Extend from a base page (if we create one)
2. Define locators as getters
3. Create action methods (click, fill, etc.)
4. Create assertion methods (verify...)

Example:

```typescript
export class MyPage {
  readonly page: Page

  // Locators
  get submitButton() {
    return this.page.getByRole('button', { name: 'Submit' })
  }

  // Actions
  async clickSubmit() {
    await hydratedClick(this.submitButton)
  }

  // Assertions
  async verifySubmitted() {
    await expect(this.page.getByText('Success')).toBeVisible()
  }
}
```

## Common Test Patterns

### Navigation Test

```typescript
test('page navigation works', async ({ page }) => {
  await page.goto('/start')
  await hydratedClick(page.getByRole('link', { name: 'Next Page' }))
  await waitForNextJsNavigation(page, /\/next-page/)
  await expect(page).toHaveURL(/\/next-page/)
})
```

### Form Submission Test

```typescript
test('form submission works', async ({ page }) => {
  await hydratedFill(page.getByLabel('Name'), 'Test User')
  await hydratedClick(page.getByRole('button', { name: 'Submit' }))
  await expect(page.getByText('Success')).toBeVisible()
})
```

### Table Interaction Test

```typescript
test('table filtering works', async ({ page }) => {
  const accounts = new AccountsPage(page)
  await accounts.goto()

  const initialCount = await accounts.getAccountRowCount()
  await accounts.searchByName('British')
  await page.waitForTimeout(500) // Debounce delay

  const filteredCount = await accounts.getAccountRowCount()
  expect(filteredCount).toBeLessThanOrEqual(initialCount)
})
```

## Hydration Issues - Deep Dive

### Why Hydration Matters

Next.js App Router uses React Server Components (RSC):

1. **Server renders** HTML → sent to browser
2. **React hydrates** → attaches event handlers
3. **Component becomes interactive** → ready for user interaction

If tests click before step 3, they fail with "element not found" or timeout errors.

### Signs of Hydration Issues

- ✅ `toBeVisible()` passes (element in DOM)
- ❌ `click()` fails (element not interactive)
- ❌ Tests pass locally but fail in CI
- ❌ Random timeouts

### Solution Pattern

```typescript
// 1. Navigate to page
await page.goto('/accounts/british-telecom')

// 2. Wait for hydration
await waitForNextJsNavigation(page)

// 3. Click after hydration
await hydratedClick(page.getByRole('button', { name: 'Tab' }))

// 4. Wait for content to load
await waitForTabContent(page, '[role="tabpanel"]')
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Merges to main
- Manual triggers

### GitHub Actions Configuration

```yaml
- name: Run Playwright tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Maintenance

### When to Update Tests

1. **UI changes:** Update page objects and selectors
2. **New features:** Add new test specs
3. **API changes:** Update expected responses
4. **Test flakiness:** Add hydration waits or improve selectors

### Test Health Monitoring

Check test health regularly:

```bash
# Run tests 10 times to detect flakiness
for i in {1..10}; do npm run test:e2e; done

# Check for consistently slow tests
npx playwright test --reporter=html
```

### Retries

Configure retries in `playwright.config.ts`:

```typescript
export default defineConfig({
  retries: process.env.CI ? 2 : 0, // Retry twice in CI
})
```

## Troubleshooting

### "Element not found" errors

**Cause:** Selector doesn't match element

**Fix:**
1. Check element with Playwright Inspector
2. Use more specific selector
3. Add `.first()` if multiple matches

### "Timeout exceeded" errors

**Cause:** Element takes too long to appear/become interactive

**Fix:**
1. Increase timeout: `{ timeout: 15000 }`
2. Use `waitForHydration()` for client components
3. Wait for network idle before interacting

### Tests pass locally, fail in CI

**Cause:** Timing differences, network latency, or resource constraints

**Fix:**
1. Add explicit waits, not implicit timeouts
2. Use `networkidle` load state
3. Increase timeouts slightly in CI

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/playwright)
- [React Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Investigation Document](../ralph/investigation.md) - Tab switching hydration fix

---

Last Updated: 2026-02-16
Test Suite Status: 34/34 passing (100%)
