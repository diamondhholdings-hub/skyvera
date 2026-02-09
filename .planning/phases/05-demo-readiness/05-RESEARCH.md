# Phase 5: Demo Readiness - Research

**Researched:** 2026-02-09
**Domain:** End-to-End Testing, Error Resilience, Performance Optimization, Demo Data Quality
**Confidence:** HIGH

## Summary

Phase 5 hardens the complete Skyvera BI platform for executive demonstration by ensuring reliability, performance, and polish across all features built in Phases 1-4. Research shows that demo-ready applications in 2026 require three critical pillars: automated E2E testing with real API validation, graceful error handling with business-friendly fallbacks, and aggressive performance optimization with strategic caching.

The locked decisions from CONTEXT.md establish a clear path: use Playwright for automated testing with real API calls (not mocks), implement cached fallback responses for Claude API failures, optimize dashboard load to under 2 seconds with 5-minute cache TTL, and ensure all 140 customer accounts have full intelligence coverage. The "fix immediately on failure" philosophy means the demo flow must pass 3x without critical failures before sign-off.

The standard approach for demo-ready applications in 2026 is: (1) Playwright E2E tests organized with Page Object Model and fixtures for maintainability, (2) Next.js 15 error boundaries with user-friendly fallback UI at every route segment, (3) Cache-first architecture with time-based revalidation (5-15 min TTL) and manual refresh capability, (4) Hybrid data strategy with pre-computed insights for hero accounts and on-demand generation with caching for others.

**Primary recommendation:** Build Playwright test suite FIRST (covering critical demo flow), then add error boundaries to all routes, then optimize performance with aggressive caching. Test the full demo flow 3x with real APIs (Claude, NewsAPI) to validate rate limiting and error handling under production conditions before considering phase complete.

## Standard Stack

The established libraries/tools for demo readiness and production hardening:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | Latest (1.48+) | E2E testing framework | Official Next.js testing recommendation, supports all browsers, auto-waiting built-in, excellent TypeScript support |
| Next.js 15 | 15.1+ | App Router framework | Built-in error boundaries, granular caching control, performance optimization features, production-ready |
| React 19 | 19.2+ | UI framework | Suspense boundaries, useActionState for error handling, improved Error Boundary patterns |
| Next.js Error Boundaries | Built-in | Error handling | error.js files for route segment errors, global-error.js for root errors, automatic recovery with reset() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | Latest | Test runner and assertions | Required for Playwright test execution, fixtures, and parallel test runs |
| react-loading-skeleton | Latest (3.x) | Loading state UI | Professional loading indicators for empty states and data fetching |
| nuqs | Latest | URL state management | Persist filters and view state in URL for shareable links and back button support |
| Web Vitals | Built-in Next.js | Performance monitoring | Track LCP, FID, CLS metrics with useReportWebVitals hook (optional instrumentation) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Playwright has better TypeScript support, faster execution, official Next.js recommendation since 2024 |
| Page Object Model | Test selectors only | POM centralizes locators and improves maintainability but adds abstraction overhead |
| Cache-first with TTL | Real-time data only | Real-time ensures freshness but 10x slower and higher API costs. Demo acceptable with 5-15 min TTL |
| Error boundaries per route | Global error handler | Granular boundaries allow partial page recovery, global handler only for catastrophic failures |
| newspaper4k (OSINT) | Custom web scraper | newspaper4k is battle-tested with anti-bot bypassing, custom scrapers are fragile and maintenance burden |

**Installation:**
```bash
# Playwright E2E testing
npm install -D @playwright/test
npx playwright install  # Install browser binaries

# UI enhancement libraries (optional)
npm install react-loading-skeleton nuqs

# Performance monitoring (built into Next.js, no install needed)
# Use useReportWebVitals in app/layout.tsx
```

## Architecture Patterns

### Recommended Test Structure
```
tests/
├── e2e/                          # End-to-end demo flow tests
│   ├── demo-flow.spec.ts         # Critical path: Dashboard → Accounts → Account Plan
│   └── fixtures/                 # Test data and setup
│       ├── test-data.ts          # Known-good test accounts
│       └── auth.setup.ts         # Authentication if needed
├── smoke/                        # Feature smoke tests
│   ├── dashboard.spec.ts         # Dashboard loads, KPIs visible
│   ├── accounts-list.spec.ts     # Account table renders, filtering works
│   ├── account-plan.spec.ts      # Account plan tabs load, intelligence visible
│   ├── query.spec.ts             # NL query returns results
│   └── scenario.spec.ts          # Scenario analysis completes
├── pages/                        # Page Object Models
│   ├── dashboard.page.ts         # Dashboard locators and actions
│   ├── accounts.page.ts          # Accounts list locators and actions
│   └── account-plan.page.ts      # Account plan locators and actions
├── fixtures/                     # Playwright fixtures
│   └── base-fixtures.ts          # Page objects as fixtures
└── playwright.config.ts          # Playwright configuration
```

### Pattern 1: Playwright E2E Test with Real API Calls

**What:** End-to-end tests that exercise the complete demo flow using real external APIs (Claude, NewsAPI) to validate rate limiting, caching, and error handling under production conditions.

**When to use:** Critical demo flow validation. Required by CONTEXT.md decision: "Test with real API calls to validate rate limiting and error handling under production conditions."

**Example:**
```typescript
// tests/e2e/demo-flow.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'
import { AccountsPage } from '../pages/accounts.page'
import { AccountPlanPage } from '../pages/account-plan.page'

test.describe('Critical Demo Flow', () => {
  let dashboardPage: DashboardPage
  let accountsPage: AccountsPage
  let accountPlanPage: AccountPlanPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    accountsPage = new AccountsPage(page)
    accountPlanPage = new AccountPlanPage(page)
  })

  test('Complete demo walkthrough with real APIs', async ({ page }) => {
    // STEP 1: Dashboard loads in under 2 seconds
    const startTime = Date.now()
    await dashboardPage.goto()
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000) // Dashboard <2s requirement

    // Verify KPIs visible (no loading spinners)
    await expect(dashboardPage.totalRevenueKPI).toBeVisible()
    await expect(dashboardPage.totalRevenueKPI).not.toContainText('Loading')

    // STEP 2: Navigate to Accounts list
    await dashboardPage.clickAccountsNav()
    await expect(accountsPage.accountTable).toBeVisible()

    // Filter to British Telecom (hero account)
    await accountsPage.filterByName('British Telecom')
    await expect(accountsPage.firstAccountRow).toContainText('British Telecom')

    // STEP 3: Open Account Plan for British Telecom
    await accountsPage.clickFirstAccount()
    await expect(accountPlanPage.overviewTab).toBeVisible()

    // STEP 4: Verify intelligence tabs load (real Claude API calls)
    await accountPlanPage.clickIntelligenceTab()

    // First load might take longer (real Claude API call)
    // Subsequent loads should be cached (<500ms)
    await expect(accountPlanPage.intelligenceContent).toBeVisible({ timeout: 10000 })

    // Verify no error states visible
    await expect(page.locator('text="API timeout error"')).not.toBeVisible()
    await expect(page.locator('text="Service unavailable"')).not.toBeVisible()

    // STEP 5: Test manual refresh (should work even if cached)
    const refreshButton = page.locator('button:has-text("Refresh")')
    await expect(refreshButton).toBeVisible()
    await refreshButton.click()

    // Loading indicator appears briefly
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()

    // Fresh data loads (might be same as cached, but request succeeds)
    await expect(accountPlanPage.intelligenceContent).toBeVisible()
  })

  test('Demo flow passes 3 consecutive times', async ({ page }) => {
    // Run critical flow 3x to meet CONTEXT.md requirement
    for (let run = 1; run <= 3; run++) {
      await test.step(`Demo run ${run}/3`, async () => {
        await dashboardPage.goto()
        await dashboardPage.clickAccountsNav()
        await accountsPage.filterByName('British Telecom')
        await accountsPage.clickFirstAccount()
        await accountPlanPage.clickIntelligenceTab()

        // All steps succeed without critical failures
        await expect(accountPlanPage.intelligenceContent).toBeVisible({ timeout: 10000 })
      })
    }
  })
})
```

**Source:** [Playwright Best Practices](https://playwright.dev/docs/best-practices), [Testing Next.js with Playwright](https://nextjs.org/docs/app/guides/testing/playwright)

### Pattern 2: Page Object Model with Fixtures

**What:** Page objects encapsulate locators and actions for each page, injected via Playwright fixtures for cleaner test code and centralized maintenance.

**When to use:** All E2E tests. Required for maintainability when tests exceed 5-10 specs. Makes UI changes require updates in one place only.

**Example:**
```typescript
// tests/pages/dashboard.page.ts
import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly totalRevenueKPI: Locator
  readonly netMarginKPI: Locator
  readonly accountsNavLink: Locator
  readonly refreshButton: Locator

  constructor(page: Page) {
    this.page = page

    // User-facing locators (prioritize role-based)
    this.totalRevenueKPI = page.getByRole('heading', { name: /total revenue/i })
    this.netMarginKPI = page.getByRole('heading', { name: /net margin/i })
    this.accountsNavLink = page.getByRole('link', { name: /accounts/i })
    this.refreshButton = page.getByRole('button', { name: /refresh/i })
  }

  async goto() {
    await this.page.goto('/dashboard')
    // Wait for KPIs to be visible (not loading state)
    await this.totalRevenueKPI.waitFor({ state: 'visible' })
  }

  async clickAccountsNav() {
    await this.accountsNavLink.click()
    await this.page.waitForURL('**/accounts')
  }

  async clickRefresh() {
    await this.refreshButton.click()
    // Wait for loading indicator to disappear
    await this.page.locator('[data-testid="loading-spinner"]').waitFor({ state: 'hidden' })
  }

  async getLoadTime(): Promise<number> {
    const startTime = Date.now()
    await this.goto()
    return Date.now() - startTime
  }
}

// tests/fixtures/base-fixtures.ts
import { test as base } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard.page'
import { AccountsPage } from '../pages/accounts.page'

type PageFixtures = {
  dashboardPage: DashboardPage
  accountsPage: AccountsPage
}

export const test = base.extend<PageFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page)
    await use(dashboardPage)
  },

  accountsPage: async ({ page }, use) => {
    const accountsPage = new AccountsPage(page)
    await use(accountsPage)
  }
})

export { expect } from '@playwright/test'

// Usage in tests
import { test, expect } from './fixtures/base-fixtures'

test('Dashboard loads quickly', async ({ dashboardPage }) => {
  const loadTime = await dashboardPage.getLoadTime()
  expect(loadTime).toBeLessThan(2000)
})
```

**Source:** [Playwright Page Object Models](https://playwright.dev/docs/pom), [Playwright Fixtures Guide](https://www.checklyhq.com/blog/page-object-models-and-fixtures-with-playwright/)

### Pattern 3: Error Boundaries with Cached Fallback

**What:** Next.js error.js files at each route segment catch rendering errors and display user-friendly fallback UI with cached data when available.

**When to use:** All major route segments (dashboard, accounts, account plans). Required by CONTEXT.md: "Claude API failures: Fall back to cached responses. Show empty states with clear 'No data available' messages."

**Example:**
```typescript
// app/accounts/[name]/error.tsx
'use client'

import { useEffect } from 'react'

export default function AccountPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for debugging but don't expose to user
    console.error('Account plan error:', error)
  }, [error])

  // Check if error is Claude API failure (429 rate limit or timeout)
  const isAPIError = error.message.includes('429') ||
                     error.message.includes('timeout') ||
                     error.message.includes('Claude API')

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      {isAPIError ? (
        <>
          <h2 className="text-xl font-semibold">Data temporarily unavailable</h2>
          <p className="text-gray-600 text-center max-w-md">
            We're experiencing high demand. Showing cached data from earlier today.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try refreshing
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-gray-600">
            Unable to load account plan. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload page
          </button>
        </>
      )}
    </div>
  )
}

// app/accounts/[name]/page.tsx - Server Component with error handling
import { ClaudeOrchestrator } from '@/lib/intelligence/claude/orchestrator'
import { cache } from '@/lib/cache/manager'

export default async function AccountPlanPage({ params }: { params: { name: string } }) {
  const accountName = decodeURIComponent(params.name)

  try {
    // Attempt to fetch intelligence with Claude API
    const intelligence = await getAccountIntelligence(accountName)

    return <AccountPlanView intelligence={intelligence} accountName={accountName} />

  } catch (error) {
    // Check if cached data exists
    const cachedIntelligence = await cache.get(`intelligence:${accountName}`)

    if (cachedIntelligence) {
      // Serve stale data with indicator
      return (
        <div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-sm text-yellow-700">
              Showing cached data from {cachedIntelligence.timestamp}.
              <button className="ml-2 underline">Refresh</button>
            </p>
          </div>
          <AccountPlanView
            intelligence={cachedIntelligence.data}
            accountName={accountName}
          />
        </div>
      )
    }

    // No cached data available, throw to error boundary
    throw new Error('Claude API unavailable and no cached data found')
  }
}
```

**Source:** [Next.js Error Handling](https://nextjs.org/docs/app/getting-started/error-handling), [Better Stack Next.js Error Handling](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/)

### Pattern 4: Aggressive Dashboard Caching with 5-Minute TTL

**What:** Dashboard data cached for 5 minutes with Next.js Data Cache and Request Memoization, prioritizing speed over absolute freshness per CONTEXT.md requirement.

**When to use:** Dashboard route only. CONTEXT.md specifies: "Dashboard target (<2s load): Aggressive caching - cache all dashboard data for 5 minutes (fast load prioritized over absolute freshness)."

**Example:**
```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { DashboardSkeleton } from './components/dashboard-skeleton'
import { unstable_cache } from 'next/cache'

// Cache dashboard data for 5 minutes (300 seconds)
const getCachedDashboardData = unstable_cache(
  async () => {
    const [kpis, buBreakdown, recentAlerts] = await Promise.all([
      getDashboardKPIs(),
      getBUBreakdown(),
      getRecentAlerts()
    ])

    return { kpis, buBreakdown, recentAlerts, cachedAt: new Date().toISOString() }
  },
  ['dashboard-data'],
  {
    revalidate: 300, // 5 minutes
    tags: ['dashboard']
  }
)

export default async function DashboardPage() {
  // Data is cached for 5 minutes, subsequent requests serve from cache
  const data = await getCachedDashboardData()

  return (
    <div>
      {/* Show cache timestamp in dev mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mb-2">
          Data cached at: {new Date(data.cachedAt).toLocaleTimeString()}
        </div>
      )}

      <Suspense fallback={<DashboardSkeleton />}>
        <KPISection kpis={data.kpis} />
        <BUBreakdown data={data.buBreakdown} />
        <RecentAlertsPreview alerts={data.recentAlerts} />
      </Suspense>

      {/* Manual refresh button (invalidates cache) */}
      <RefreshButton />
    </div>
  )
}

// components/refresh-button.tsx (Client Component)
'use client'

import { useRouter } from 'next/navigation'
import { revalidateTag } from 'next/cache'

export function RefreshButton() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    // Invalidate cache and refresh page
    await fetch('/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({ tag: 'dashboard' })
    })

    router.refresh()
    setIsRefreshing(false)
  }

  return (
    <button onClick={handleRefresh} disabled={isRefreshing}>
      {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
    </button>
  )
}

// app/api/revalidate/route.ts (Server Action for cache invalidation)
import { revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { tag } = await request.json()

  revalidateTag(tag)

  return Response.json({ revalidated: true, now: Date.now() })
}
```

**Source:** [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching), [Next.js 15 Caching Strategies 2026](https://johal.in/next-js-15-advanced-patterns-app-router-server-actions-and-caching-strategies-for-2026/)

### Pattern 5: Pre-computed Intelligence for Hero Accounts

**What:** Pre-generate Claude insights for top 5 hero accounts during build/startup, cache for 15 minutes. Generate live with cache for remaining 135 accounts.

**When to use:** Intelligence data for demos. CONTEXT.md specifies: "Pre-compute for hero accounts (British Telecom, Liquid Telecom, Telefonica UK, Spotify, AT&T), generate live with cache for others."

**Example:**
```typescript
// lib/intelligence/warmup/hero-accounts.ts
const HERO_ACCOUNTS = [
  'British Telecom',
  'Liquid Telecom',
  'Telefonica UK',
  'Spotify',
  'AT&T'
]

export async function warmupHeroAccounts() {
  console.log('Pre-computing intelligence for hero accounts...')

  const results = await Promise.allSettled(
    HERO_ACCOUNTS.map(async (accountName) => {
      const intelligence = await generateAccountIntelligence(accountName)

      // Cache for 15 minutes
      await cache.set(
        `intelligence:${accountName}`,
        { data: intelligence, timestamp: new Date().toISOString() },
        { ttl: 900 } // 15 minutes
      )

      console.log(`✓ Cached intelligence for ${accountName}`)
      return accountName
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  console.log(`Pre-computation complete: ${successful}/${HERO_ACCOUNTS.length} accounts`)
}

// app/accounts/[name]/page.tsx - Hybrid strategy
export async function generateStaticParams() {
  // Pre-render hero accounts at build time
  return HERO_ACCOUNTS.map(name => ({ name: encodeURIComponent(name) }))
}

async function getAccountIntelligence(accountName: string) {
  const isHeroAccount = HERO_ACCOUNTS.includes(accountName)

  if (isHeroAccount) {
    // Hero accounts: check cache, should be pre-warmed
    const cached = await cache.get(`intelligence:${accountName}`)
    if (cached) return cached.data
  }

  // Non-hero accounts OR cache miss: generate live with caching
  const intelligence = await claudeOrchestrator.processRequest({
    prompt: buildAccountIntelligencePrompt(accountName),
    priority: isHeroAccount ? 'HIGH' : 'MEDIUM',
    maxTokens: 2048
  })

  // Cache result (15 min TTL)
  await cache.set(
    `intelligence:${accountName}`,
    { data: intelligence, timestamp: new Date().toISOString() },
    { ttl: 900 }
  )

  return intelligence
}

// scripts/warmup-cache.ts - Run before demo
import { warmupHeroAccounts } from '@/lib/intelligence/warmup/hero-accounts'

async function main() {
  console.log('Starting cache warmup for demo...')

  // Pre-compute hero accounts
  await warmupHeroAccounts()

  // Optional: Pre-fetch news for all 140 accounts
  console.log('Pre-fetching news data...')
  await warmupNewsData()

  console.log('Cache warmup complete. Demo ready.')
}

main()
```

**Source:** [Cache Warming Strategies 2026](https://oneuptime.com/blog/post/2026-01-30-cache-warming-strategies/view), [Next.js Static Generation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| E2E test framework | Custom Selenium wrapper | Playwright | Auto-waiting, parallel execution, browser contexts, official Next.js recommendation. Custom frameworks miss edge cases. |
| Page object injection | Manual class instantiation in tests | Playwright fixtures | Fixtures provide setup/teardown, dependency injection, test isolation. Manual instantiation clutters tests. |
| Loading skeleton UI | Custom CSS animations | react-loading-skeleton | Automatic sizing, theme support, SSR compatible. Custom skeletons look janky and require maintenance. |
| Error boundary hierarchy | Try/catch in every component | Next.js error.js files | Automatic error catching during render, granular recovery with reset(), file-system based routing. |
| Cache invalidation | Manual timestamp tracking | Next.js revalidateTag/revalidatePath | Tag-based cache invalidation, works across Data Cache and Full Route Cache. Manual tracking has race conditions. |
| Performance monitoring | Custom timing code | Next.js useReportWebVitals | Automatic LCP, FID, CLS tracking. Integrates with analytics. Custom timing misses browser APIs and edge cases. |
| News scraping | Custom HTML parser | newspaper4k (Python) or ScrapingBee API | Anti-bot bypassing, article extraction, metadata parsing. Custom scrapers break on site changes and get blocked. |
| Retry with backoff | setTimeout in try/catch | Exponential backoff library or rate-limiter-flexible | Proper jitter, max retries, distributed rate limiting. Custom retry logic causes thundering herd. |

**Key insight:** Demo readiness is about polish and reliability under production conditions. Playwright, Next.js 15 error boundaries, and caching mechanisms are battle-tested with thousands of edge cases handled. For 24-hour deadline, use established patterns instead of reinventing.

## Common Pitfalls

### Pitfall 1: Testing with Mocked APIs Instead of Real Calls

**What goes wrong:** Tests use mocked Claude API responses and mocked NewsAPI data. All tests pass. Demo day arrives, hit real API rate limits (429 errors), cache doesn't work as expected, error handling never triggered during testing. Demo breaks.

**Why it happens:** Mocking is faster and more reliable for unit tests. Developers assume mocked behavior matches real API behavior. CONTEXT.md explicitly requires "Test with real API calls to validate rate limiting and error handling under production conditions" but time pressure leads to shortcuts.

**How to avoid:**
1. E2E tests MUST use real APIs: Claude API, NewsAPI, not mocks
2. Test rate limiting: Fire 60+ requests in 60 seconds, verify queueing works without 429 errors
3. Test cache fallback: Disable API temporarily, verify cached data served
4. Test error recovery: Simulate timeout (delay API response), verify error boundary displays fallback UI
5. Run "demo rehearsal": Execute full demo flow 3x consecutively, all must pass
6. Monitor API usage during tests: Log requests, verify rate limiter working
7. Use dedicated test API keys: Don't pollute production API quota with test runs

**Warning signs:**
- Playwright tests use page.route() to mock API responses
- Tests never actually call Claude API or NewsAPI
- Rate limiter code exists but never tested under load
- Cache fallback logic exists but never triggered in tests
- Tests pass in under 10 seconds (real APIs take longer)
- No API usage monitoring during test runs

**Phase to address:** Phase 5, Hours 0-4 when building test suite. Real API testing is foundation.

**Demo impact if not handled:** DEMO STOPPER. Rate limit errors during live demo are unrecoverable. "Let me restart" destroys credibility.

### Pitfall 2: Missing Error Boundaries at Route Segments

**What goes wrong:** Claude API times out during account plan load. No error.js file at that route segment. Next.js default error page shows (or worse, blank screen). Executive sees technical error message or white screen.

**Why it happens:** Error boundaries added as cleanup task instead of with feature development. Developers test happy path only (fast network, APIs always respond). Demo environment has poor connectivity (conference WiFi, VPN latency).

**How to avoid:**
1. Add error.js to EVERY route segment: /dashboard, /accounts, /accounts/[name], /query, /scenario
2. Add global-error.js for root layout errors
3. Test error boundaries: Intentionally throw errors in components, verify fallback UI displays
4. Use business-friendly language: "Data temporarily unavailable" not "Error 500: Internal Server Error"
5. Implement reset() function: Allow user recovery without full page reload
6. Show cached data when available: Don't fail completely if cache exists
7. Test with network throttling: Chrome DevTools > Network > Slow 3G

**Warning signs:**
- No error.js files in app directory
- Error boundaries only at root level
- Technical error messages visible in UI ("TypeError: Cannot read property...")
- Testing only with fast, reliable network
- No "Try again" or "Refresh" buttons in error states
- Errors crash entire app instead of isolated component

**Phase to address:** Phase 5, Hours 2-4 when hardening routes. Add error boundaries immediately after core features.

**Demo impact if not handled:** DEMO STOPPER. White screen or technical error during demo is fatal. Lost credibility.

### Pitfall 3: Dashboard Cache Not Actually Working

**What goes wrong:** Dashboard loads slowly (3-5 seconds) every time despite aggressive caching implementation. Cache code exists but misconfigured. CONTEXT.md requirement (<2s load) not met.

**Why it happens:** Next.js 15 changed caching defaults: GET requests are NOT cached by default. Fetch calls without explicit cache options are uncached. Developers assume caching is automatic. Testing with single page load doesn't reveal cache misses.

**How to avoid:**
1. Use unstable_cache for data fetching: Explicit cache with TTL and tags
2. Set revalidate: 300 for 5-minute TTL on dashboard route
3. Test cache hits: Load dashboard twice, second load should be <500ms
4. Log cache behavior: Console log "Cache HIT" vs "Cache MISS" in dev mode
5. Verify with Network tab: Second dashboard load should have zero API calls
6. Use revalidateTag for manual refresh: Don't just reload page
7. Add cache timestamp to UI (dev mode): "Data cached at 10:23:45 AM"

**Warning signs:**
- Dashboard loads same speed every time (3-5 seconds)
- Network tab shows API calls on every page load
- No revalidate option in fetch calls
- Not using unstable_cache or cache configuration
- Manual refresh doesn't actually invalidate cache
- No way to verify if cache is working

**Phase to address:** Phase 5, Hours 4-6 when optimizing performance. Test cache immediately after implementation.

**Demo impact if not handled:** DEMO CREDIBILITY DAMAGE. Slow dashboard load undermines "fast" narrative. Executive thinks system is slow.

### Pitfall 4: Pre-computation Never Runs Before Demo

**What goes wrong:** Code exists to pre-compute intelligence for hero accounts. Script never runs before demo. First time loading British Telecom account during demo, Claude API generates intelligence live (5-10 seconds). Demo momentum lost.

**Why it happens:** Cache warming script exists but not in demo checklist. Developers assume "cache will warm up naturally during testing" but test with different accounts. No verification that hero accounts cached before demo starts.

**How to avoid:**
1. Create explicit warmup script: scripts/warmup-cache.ts
2. Add to demo checklist: "Run npm run warmup before demo"
3. Verify cache status: Script outputs "✓ Cached British Telecom" for each hero account
4. Test hero account loading: Should be <1s after warmup (cache hit)
5. Set longer TTL for pre-computed data: 30 minutes instead of 15 for stability
6. Run warmup 10 minutes before demo: Ensures cache fresh but stable
7. Log cache misses: If hero account is cache miss, something wrong

**Warning signs:**
- Warmup script exists but never executed
- No demo checklist or runbook
- Hero accounts load slowly first time (5-10 seconds)
- No way to verify cache status before demo
- Cache TTL too short (expires before demo ends)
- No monitoring of which accounts are cached

**Phase to address:** Phase 5, Hours 6-8 when implementing data quality. Create and TEST warmup script.

**Demo impact if not handled:** DEMO FLOW KILLER. 10-second delay loading main account during demo is unacceptable. Kills momentum.

### Pitfall 5: Playwright Tests Are Flaky

**What goes wrong:** Playwright tests pass 2 times, fail on 3rd run with "element not found" or "timeout waiting for selector". Can't achieve required "3x consecutive passes" from CONTEXT.md. Demo readiness blocked by flaky tests.

**Why it happens:** Tests use brittle selectors (CSS classes, IDs that change). No auto-waiting (manual wait times instead of Playwright built-in). Tests don't isolate properly (shared state between runs). Network timing varies.

**How to avoid:**
1. Use role-based locators: page.getByRole('button', { name: 'Submit' }) not page.locator('.btn-submit')
2. Rely on auto-waiting: Playwright automatically waits for actionability, don't add manual waits
3. Fresh browser context per test: Playwright does this automatically, don't disable
4. Use Page Object Model: Centralizes locators, easier to fix when UI changes
5. Increase timeout for real API calls: { timeout: 10000 } for Claude API intelligence
6. Use test.beforeEach for setup: Don't rely on test execution order
7. Run tests in parallel: Verifies proper isolation

**Warning signs:**
- Tests use CSS classes or XPath selectors
- Manual page.waitForTimeout(2000) instead of auto-waiting
- Tests fail intermittently ("works on my machine")
- Tests must run in specific order
- Shared state between tests (cookies, localStorage not cleared)
- Tests pass once but fail on retry

**Phase to address:** Phase 5, Hours 0-4 when writing tests. Use best practices from start.

**Demo impact if not handled:** BLOCKS DEMO SIGN-OFF. Can't verify demo readiness if tests aren't reliable. Risk shipping broken demo.

### Pitfall 6: No OSINT Fallback When NewsAPI Fails

**What goes wrong:** NewsAPI rate limit hit (100 requests/day on free tier exceeded) or API returns error. No fallback implementation. Accounts show "No news available" or error message. Executive asks about specific customer, no intelligence shown.

**Why it happens:** CONTEXT.md requires "NewsAPI failures: Use OSINT search as backup" but OSINT implementation deferred as "nice to have". NewsAPI assumed reliable. Free tier limits not checked before demo. Testing with 5 customers doesn't reveal limit.

**How to avoid:**
1. Verify NewsAPI tier: 140 accounts × 1 request = 140 requests. Free tier = 100/day. Need paid tier OR batch requests
2. Pre-fetch news during warmup: Single batch request for all 140 accounts, cache for 24 hours
3. Implement OSINT fallback: newspaper4k or ScrapingBee for web scraping when NewsAPI unavailable
4. Graceful degradation: If both fail, show "News data temporarily unavailable" not error
5. Test API limits: Intentionally hit rate limit, verify fallback triggers
6. Cache news aggressively: 15-minute TTL minimum, prefer 24 hours for demo stability
7. Monitor API usage: Alert when approaching daily limit

**Warning signs:**
- Using NewsAPI free tier without checking limits
- No fallback implementation for NewsAPI failures
- Each account page makes independent NewsAPI request (no batching)
- News data not cached or short TTL (5 minutes)
- Testing only with small subset of accounts (5-10)
- No API usage monitoring

**Phase to address:** Phase 5, Hours 6-8 when ensuring data coverage. Verify API limits and implement fallback.

**Demo impact if not handled:** DEMO CONFUSER. Missing news data looks incomplete. "Is the integration working?" questions undermine confidence.

### Pitfall 7: Empty States Look Broken Instead of Polished

**What goes wrong:** Account with no action items shows blank white space instead of empty state UI. Looks like bug or failed data load. Executive hesitates: "Is this broken or is there just no data?"

**Why it happens:** Empty states treated as edge case instead of designed feature. Developers focus on happy path (data exists). Demo includes accounts with missing data (new customers, no historical news).

**How to avoid:**
1. Design empty states for every data type: News, action items, financials, intelligence
2. Use clear messaging: "No action items yet. Add your first action item above." not blank space
3. Add illustrations or icons: Visual indication this is intentional, not broken
4. Provide action CTAs: "Add action item" button in empty state
5. Test with empty data: Create test account with no data, verify UI looks professional
6. Use react-loading-skeleton: Professional loading states while data fetches
7. Distinguish empty vs loading vs error: Three different UI states, all polished

**Warning signs:**
- Blank white space when data missing
- No empty state designs in UI
- "No data" shown as text only, no styling
- Empty state looks like error state
- No call-to-action in empty states
- Testing only with accounts that have full data

**Phase to address:** Phase 5, Hours 8-10 when polishing UI. Review all possible empty states.

**Demo impact if not handled:** DEMO CREDIBILITY DAMAGE. Blank spaces look unfinished. Executive questions system completeness.

## Code Examples

Verified patterns from official sources and research:

### Example 1: Playwright Config for Next.js with Real APIs

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',

  // Run tests in parallel (3 workers)
  fullyParallel: true,
  workers: 3,

  // Fail build on CI if test was accidentally left only/skip
  forbidOnly: !!process.env.CI,

  // Retry failed tests 2 times (handles network flakiness)
  retries: process.env.CI ? 2 : 1,

  // Reporter for CI (GitHub Actions)
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on failure (debug flaky tests)
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Real API calls: Do NOT mock network
    // This validates rate limiting and error handling with production APIs
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Run on Firefox to catch browser-specific issues
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // Start dev server before tests (if not already running)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000, // 2 minutes
    reuseExistingServer: !process.env.CI,
  },
})
```

**Source:** [Next.js Playwright Setup](https://nextjs.org/docs/app/guides/testing/playwright), [Playwright Configuration](https://playwright.dev/docs/test-configuration)

### Example 2: Account Plan Page with Error Boundary and Cache Fallback

```typescript
// app/accounts/[name]/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function AccountPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Account plan error:', error)
  }, [error])

  const isCacheAvailable = error.message.includes('CACHE_FALLBACK')
  const isRateLimitError = error.message.includes('429')

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8">
      <AlertCircle className="h-12 w-12 text-yellow-500" />

      {isRateLimitError ? (
        <>
          <h2 className="text-xl font-semibold text-gray-900">
            High demand right now
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            We're processing a lot of requests.
            {isCacheAvailable && ' Showing cached data from earlier today.'}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-900">
            Data temporarily unavailable
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            Unable to load account intelligence. This usually resolves in a few moments.
          </p>
        </>
      )}

      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>

      <a
        href="/accounts"
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Return to accounts list
      </a>
    </div>
  )
}

// app/accounts/[name]/page.tsx
import { cache as reactCache } from 'react'
import { ClaudeOrchestrator } from '@/lib/intelligence/claude/orchestrator'
import { CacheManager } from '@/lib/cache/manager'

const cacheManager = new CacheManager()

// React cache + Claude orchestrator + fallback handling
const getAccountIntelligence = reactCache(async (accountName: string) => {
  const cacheKey = `intelligence:${accountName}`

  try {
    // Attempt fresh Claude API call (with rate limiting)
    const intelligence = await claudeOrchestrator.processRequest({
      prompt: buildIntelligencePrompt(accountName),
      priority: 'MEDIUM',
      context: { accountName },
      maxTokens: 2048
    })

    // Cache successful response (15 min TTL)
    await cacheManager.set(cacheKey, {
      data: intelligence,
      timestamp: new Date().toISOString()
    }, { ttl: 900 })

    return intelligence

  } catch (error) {
    // Claude API failed - check for cached data
    const cached = await cacheManager.get(cacheKey)

    if (cached) {
      console.warn(`Serving cached intelligence for ${accountName}`)
      return cached.data
    }

    // No cached fallback available
    if (error.status === 429) {
      throw new Error('429: Rate limit exceeded. CACHE_FALLBACK unavailable.')
    }

    throw error
  }
})

export default async function AccountPlanPage({
  params
}: {
  params: { name: string }
}) {
  const accountName = decodeURIComponent(params.name)
  const intelligence = await getAccountIntelligence(accountName)

  return (
    <div>
      <AccountPlanTabs
        accountName={accountName}
        intelligence={intelligence}
      />
    </div>
  )
}
```

**Source:** [Next.js Error Handling](https://nextjs.org/docs/app/getting-started/error-handling), [Better Stack Error Handling Guide](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/)

### Example 3: Smoke Test for Dashboard Performance

```typescript
// tests/smoke/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard Performance', () => {
  test('Dashboard loads in under 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/dashboard')

    // Wait for key content to be visible (not loading state)
    await page.getByRole('heading', { name: /total revenue/i }).waitFor({ state: 'visible' })

    const loadTime = Date.now() - startTime

    console.log(`Dashboard load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(2000) // CONTEXT.md requirement: <2s
  })

  test('Second dashboard load uses cache (faster)', async ({ page }) => {
    // First load (cache miss)
    const firstStart = Date.now()
    await page.goto('/dashboard')
    await page.getByRole('heading', { name: /total revenue/i }).waitFor()
    const firstLoad = Date.now() - firstStart

    // Navigate away
    await page.goto('/accounts')
    await page.waitForURL('**/accounts')

    // Return to dashboard (cache hit)
    const secondStart = Date.now()
    await page.goto('/dashboard')
    await page.getByRole('heading', { name: /total revenue/i }).waitFor()
    const secondLoad = Date.now() - secondStart

    console.log(`First load: ${firstLoad}ms, Second load: ${secondLoad}ms`)

    // Second load should be significantly faster (cached)
    expect(secondLoad).toBeLessThan(firstLoad * 0.5) // At least 50% faster
  })

  test('Dashboard displays all KPIs without errors', async ({ page }) => {
    await page.goto('/dashboard')

    // All key KPIs should be visible
    await expect(page.getByRole('heading', { name: /total revenue/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /recurring revenue/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /net margin/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /ebitda/i })).toBeVisible()

    // No error messages visible
    await expect(page.locator('text="Error"')).not.toBeVisible()
    await expect(page.locator('text="Failed to load"')).not.toBeVisible()

    // No loading spinners (data loaded)
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('Manual refresh button works', async ({ page }) => {
    await page.goto('/dashboard')

    const refreshButton = page.getByRole('button', { name: /refresh/i })
    await expect(refreshButton).toBeVisible()

    // Click refresh
    await refreshButton.click()

    // Loading indicator appears briefly
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()

    // Data reloads successfully
    await expect(page.getByRole('heading', { name: /total revenue/i })).toBeVisible()
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })
})
```

**Source:** [Playwright Best Practices](https://www.browserstack.com/guide/playwright-best-practices), [Performance Testing with Playwright](https://playwright.dev/docs/test-timeouts)

### Example 4: Cache Warmup Script for Hero Accounts

```typescript
// scripts/warmup-cache.ts
import { ClaudeOrchestrator } from '@/lib/intelligence/claude/orchestrator'
import { CacheManager } from '@/lib/cache/manager'
import { NewsAPIAdapter } from '@/lib/data/adapters/external/newsapi'

const HERO_ACCOUNTS = [
  'British Telecom',
  'Liquid Telecom',
  'Telefonica UK',
  'Spotify',
  'AT&T'
]

const cache = new CacheManager()
const claude = new ClaudeOrchestrator()
const newsAPI = new NewsAPIAdapter()

async function warmupHeroAccounts() {
  console.log('🔥 Starting cache warmup for hero accounts...\n')

  const results = await Promise.allSettled(
    HERO_ACCOUNTS.map(async (accountName) => {
      console.log(`Processing ${accountName}...`)

      // Generate intelligence
      const intelligence = await claude.processRequest({
        prompt: buildIntelligencePrompt(accountName),
        priority: 'LOW', // Background task
        maxTokens: 2048
      })

      // Cache for 30 minutes (longer TTL for demo stability)
      await cache.set(
        `intelligence:${accountName}`,
        { data: intelligence, timestamp: new Date().toISOString() },
        { ttl: 1800 } // 30 minutes
      )

      console.log(`✓ Cached intelligence for ${accountName}`)
      return accountName
    })
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected')

  console.log(`\n✅ Intelligence warmup complete: ${successful}/${HERO_ACCOUNTS.length} accounts`)

  if (failed.length > 0) {
    console.warn('⚠️  Failed accounts:', failed.map(r => r.reason))
  }
}

async function warmupNewsData() {
  console.log('\n📰 Pre-fetching news data for all accounts...')

  // Fetch all customer accounts
  const accounts = await getAllCustomerAccounts() // 140 accounts

  // Batch news requests (NewsAPI might have rate limits)
  const BATCH_SIZE = 10
  let processed = 0

  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const batch = accounts.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (account) => {
        const news = await newsAPI.query({
          filters: { company: account.name },
          limit: 10
        })

        await cache.set(
          `news:${account.name}`,
          { data: news, timestamp: new Date().toISOString() },
          { ttl: 86400 } // 24 hours (news doesn't change often)
        )

        processed++
        process.stdout.write(`\rProgress: ${processed}/${accounts.length}`)
      })
    )

    // Rate limit pause between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n✅ News warmup complete: ${processed} accounts`)
}

async function verifyCacheStatus() {
  console.log('\n🔍 Verifying cache status...')

  for (const accountName of HERO_ACCOUNTS) {
    const intelligence = await cache.get(`intelligence:${accountName}`)
    const status = intelligence ? '✓ CACHED' : '✗ MISSING'
    console.log(`  ${status} - ${accountName}`)
  }
}

async function main() {
  console.log('='.repeat(50))
  console.log('DEMO CACHE WARMUP SCRIPT')
  console.log('='.repeat(50))
  console.log(`Started: ${new Date().toLocaleString()}\n`)

  try {
    // Step 1: Warmup hero accounts intelligence
    await warmupHeroAccounts()

    // Step 2: Pre-fetch news for all accounts
    await warmupNewsData()

    // Step 3: Verify cache status
    await verifyCacheStatus()

    console.log('\n' + '='.repeat(50))
    console.log('✅ DEMO READY - All caches warmed')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('\n❌ Cache warmup failed:', error)
    process.exit(1)
  }
}

// Run script
main()

// Add to package.json:
// "scripts": {
//   "warmup": "tsx scripts/warmup-cache.ts"
// }
```

**Source:** [Cache Warming Best Practices](https://oneuptime.com/blog/post/2026-01-30-cache-warming-strategies/view), [Node.js Production Scripts](https://blog.risingstack.com/mastering-async-await-in-nodejs/)

### Example 5: Empty State Component

```typescript
// components/ui/empty-state.tsx
import { FileQuestion, Plus } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon = <FileQuestion className="h-12 w-12 text-gray-400" />,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      {icon}

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-600 max-w-md">
          {description}
        </p>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </div>
  )
}

// Usage in account plan action items tab
export function ActionItemsTab({ accountName }: { accountName: string }) {
  const actionItems = useActionItems(accountName)

  if (actionItems.length === 0) {
    return (
      <EmptyState
        title="No action items yet"
        description="Create action items to track follow-ups, tasks, and strategic initiatives for this account."
        action={{
          label: "Add first action item",
          onClick: () => openAddDialog()
        }}
      />
    )
  }

  return <ActionItemsKanban items={actionItems} />
}
```

**Source:** [React Empty State Patterns](https://refine.dev/blog/react-empty-state/), [UI Best Practices 2026](https://www.smashingmagazine.com/2023/07/empty-state-ui-design/)

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| Selenium for E2E testing | Playwright with auto-waiting | 2023-2024 (Playwright maturity) | 3x faster tests, no flaky waits, better TypeScript support. Official Next.js recommendation. |
| Mock all external APIs in tests | Test with real APIs for critical flows | 2025 (production parity) | Catches rate limiting, network errors, cache issues. Higher confidence in demo readiness. |
| Try/catch in every component | Next.js error.js boundaries per route | 2024 (App Router stable) | Automatic error catching, granular recovery, file-system based. Less boilerplate. |
| Manual cache with timestamps | Next.js 15 built-in caching with tags | 2024 (Next.js 15 release) | Tag-based invalidation, automatic TTL, works across Data Cache and Full Route Cache. |
| Global error handler only | Error boundaries at each route segment | 2024 (React 19 patterns) | Partial page recovery, isolated failures, better UX. Don't crash entire app. |
| Real-time data everywhere | Cache-first with strategic revalidation | 2025 (cost optimization) | Sub-second loads, 90% cost reduction. 5-15 min TTL acceptable for demos and analytics. |
| Custom loading spinners | Suspense boundaries with skeleton UI | 2024 (React 19 Suspense stable) | Declarative loading states, automatic fallback, better perceived performance. |
| Web scraping with custom parsers | newspaper4k or ScrapingBee API | 2025 (anti-bot sophistication) | Bypass bot detection, maintain parsers, handle site changes. Custom scrapers break frequently. |

**Deprecated/outdated:**
- **Mocking all APIs in E2E tests:** Misses production issues like rate limits and network failures. Use real APIs for critical demo flows.
- **Manual setTimeout for retries:** Causes thundering herd. Use exponential backoff with jitter.
- **CSS class/ID selectors in tests:** Break on UI changes. Use role-based locators (getByRole, getByLabel).
- **Global loading spinner only:** Poor UX. Use per-component loading states with Suspense.
- **No empty state designs:** Blank space looks broken. Design intentional empty states with CTAs.
- **Hard-coded test data in specs:** Brittle, hard to update. Use fixtures and test data files.

## Open Questions

Things that couldn't be fully resolved:

1. **Playwright vs real browser for demo validation**
   - What we know: Playwright uses headless browsers (Chromium, Firefox, WebKit). Demo happens in executive's browser (likely Chrome).
   - What's unclear: Will Playwright catch browser-specific rendering issues? Should final validation include manual testing in real Chrome?
   - Recommendation: Use Playwright for automated validation (3x pass requirement). Add manual checklist: Load demo in real Chrome, verify rendering, fonts, charts display correctly. 5-minute manual check before demo start.

2. **Optimal cache TTL for demo stability vs freshness**
   - What we know: CONTEXT.md specifies 5 min for dashboard, 15 min for intelligence. Research shows demo quality acceptable with these values.
   - What's unclear: If demo lasts 30 minutes, dashboard cache expires mid-demo. Is this acceptable? Should we extend TTL for demo day only?
   - Recommendation: For demo day, extend cache TTL: 30 min for dashboard, 60 min for intelligence. Add config flag: DEMO_MODE=true that uses longer TTLs. Ensures stability during demo without permanent freshness compromise.

3. **When to implement OSINT fallback**
   - What we know: CONTEXT.md requires OSINT search when NewsAPI fails. newspaper4k is standard tool. NewsAPI free tier = 100 requests/day.
   - What's unclear: If we pre-fetch news for all 140 accounts during warmup (1 batch request), do we still hit limits? Is OSINT fallback necessary if pre-fetching works?
   - Recommendation: Test NewsAPI batching first. If single batch request for 140 accounts works within limits, OSINT can be deferred. If batch fails or rate limit hit, implement newspaper4k fallback with same cache structure. Don't build OSINT unless proven necessary.

4. **Performance instrumentation vs DevTools**
   - What we know: CONTEXT.md leaves this as Claude's discretion. Next.js has useReportWebVitals built-in. DevTools Network tab shows load times.
   - What's unclear: Is explicit instrumentation worth implementation time? Will anyone look at performance metrics after demo?
   - Recommendation: Skip explicit instrumentation for demo. Use Playwright assertions (loadTime < 2000ms) for automated validation. Use Chrome DevTools during rehearsal to verify. Add useReportWebVitals post-demo if performance monitoring needed long-term. Focus on meeting performance targets, not measuring them.

5. **Account plan optimization technique**
   - What we know: CONTEXT.md leaves choice of optimization technique (pre-compute vs pre-warm vs lazy load) to Claude's discretion.
   - What's unclear: Which technique best balances demo quality with implementation complexity?
   - Recommendation: Use hybrid approach: (1) Pre-compute hero accounts during warmup (5 accounts), (2) Lazy load with aggressive caching for remaining 135 accounts (15 min TTL), (3) Use React Suspense for tab loading (Intelligence tab can show skeleton while loading). This gives instant load for scripted walkthrough (hero accounts), acceptable load for exploration (lazy + cache), and good perceived performance (Suspense skeletons).

## Sources

### Primary (HIGH confidence)
- [Playwright Official Documentation - Best Practices](https://playwright.dev/docs/best-practices)
- [Next.js Testing Guide - Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [Next.js Caching Guide (App Router)](https://nextjs.org/docs/app/guides/caching)
- [Next.js Error Handling (App Router)](https://nextjs.org/docs/app/getting-started/error-handling)
- [Playwright Page Object Models](https://playwright.dev/docs/pom)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)

### Secondary (MEDIUM confidence)
- [BrowserStack - Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)
- [DeviQA - Playwright E2E Testing Guide 2026](https://www.deviqa.com/blog/guide-to-playwright-end-to-end-testing-in-2025/)
- [Better Stack - Next.js Error Handling](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nextjs/)
- [Next.js 15 Advanced Patterns 2026](https://johal.in/next-js-15-advanced-patterns-app-router-server-actions-and-caching-strategies-for-2026/)
- [DEV.to - Next.js Caching Guide 2026](https://dev.to/marufrahmanlive/nextjs-caching-and-rendering-complete-guide-for-2026-ij2)
- [OneUpTime - Cache Warming Strategies 2026](https://oneuptime.com/blog/post/2026-01-30-cache-warming-strategies/view)
- [ScrapingBee - Best News APIs 2026](https://www.scrapingbee.com/blog/top-best-news-apis-for-you/)
- [Checkly - Page Object Models and Fixtures with Playwright](https://www.checklyhq.com/blog/page-object-models-and-fixtures-with-playwright/)
- [OneUpTime - E2E Testing Best Practices 2026](https://oneuptime.com/blog/post/2026-01-30-e2e-testing-best-practices/view)
- [Port.io - Production Readiness Checklist](https://www.port.io/blog/production-readiness-checklist-ensuring-smooth-deployments)

### Tertiary (LOW confidence - requires verification)
- NewsAPI.ai free tier limits (100 requests/day) - mentioned in multiple sources but should verify current pricing
- Optimal cache TTL for demo scenarios (5-15 min) - research consensus but project-specific
- newspaper4k as OSINT alternative - community recommendation, needs testing with specific news sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright official Next.js recommendation, Next.js 15 error boundaries documented, caching patterns verified
- Architecture patterns: HIGH - Based on official Playwright and Next.js documentation, verified code examples
- Pitfalls: HIGH - Common failure patterns from production readiness guides and E2E testing best practices
- Code examples: HIGH - Patterns from official docs (Playwright, Next.js) adapted for Skyvera context

**Research date:** 2026-02-09
**Valid until:** 30 days (March 11, 2026) - Testing frameworks and Next.js patterns stable, but Playwright/Next.js may release updates

---

## Next Steps for Planning

Planner should focus on:

1. **Hours 0-4: Test Suite Foundation** - Build Playwright test suite with Page Object Model and fixtures. Write critical demo flow test (dashboard → accounts → account plan). Must pass 3x consecutively before moving forward.

2. **Hours 2-4: Error Boundaries Everywhere** - Add error.js to all route segments (/dashboard, /accounts, /accounts/[name], /query, /scenario). Implement cached fallback logic for Claude API failures. User-friendly error messages.

3. **Hours 4-6: Dashboard Performance Optimization** - Implement aggressive caching (5 min TTL) with Next.js 15 unstable_cache. Verify <2s load time in Playwright test. Add manual refresh button with cache invalidation.

4. **Hours 6-8: Data Quality and Coverage** - Create cache warmup script for hero accounts. Pre-compute intelligence for 5 hero accounts, lazy load with cache for remaining 135. Verify NewsAPI batching works for 140 accounts or implement fallback.

5. **Hours 8-10: Polish and Empty States** - Design empty states for all data types (action items, news, intelligence). Add loading skeletons. Ensure all 140 accounts handle exploration without critical failures.

6. **Hours 10-12: Demo Rehearsal** - Run complete demo flow 3x with real APIs. Verify performance targets met. Check error handling under poor network conditions. Create demo runbook (warmup script, verification checklist).

**Critical path dependencies:**
- Test suite → All validation depends on it (must pass 3x)
- Error boundaries → Demo reliability depends on graceful failures
- Dashboard caching → Performance target (<2s) depends on it
- Cache warmup → Hero account demo quality depends on it
- Real API testing → Rate limiting validation depends on it
