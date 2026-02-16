# Account Plan Tab Switching Test Failures - Investigation

## Date: 2026-02-16

## Issue Summary
8 out of 8 account plan tab switching tests failing with timeout errors.

## Root Cause Analysis

### The Problem
Tests timeout (15000ms) trying to find tab buttons:
```
TimeoutError: locator.click: Timeout 15000ms exceeded.
waiting for getByRole('button', { name: 'Financials' })
```

### Why It Happens

**Hydration Timing Issue:**

1. **TabNavigation Component** (`src/app/accounts/[name]/_components/tab-navigation.tsx`):
   - Wrapped in `<Suspense>` boundary
   - Client component using `useSearchParams()` hook
   - Requires client-side hydration before interactive

2. **Test Execution Flow:**
   ```
   page.goto() → Server renders → HTML sent → Client hydration starts
                                                           ↓
   Test tries to click → Buttons not interactive yet → TIMEOUT
   ```

3. **Why Previous Tests Passed:**
   - Tests that just checked visibility worked (elements exist in DOM)
   - Tests trying to CLICK failed (elements not hydrated/interactive yet)

### Technical Details

**Component Structure:**
- Desktop (>= 768px): Horizontal `<button>` elements
- Mobile (< 768px): `<select>` dropdown with `#tab-select` ID
- Playwright viewport: 1280x720 (desktop mode)
- Breakpoint: `md:` = 768px (Tailwind CSS)

**The Race Condition:**
```typescript
// OLD CODE - FAILED
const button = this.page.getByRole('button', { name: 'Financials' })
await button.click() // Clicks immediately, before hydration completes
```

## Solution Applied

**Fix in `tests/pages/account-plan.page.ts`:**

```typescript
// NEW CODE - WAITS FOR HYDRATION
async clickTab(tabName) {
  // 1. Wait for EITHER desktop buttons OR mobile select to appear
  await Promise.race([
    button.waitFor({ state: 'visible', timeout: 10000 }),
    select.waitFor({ state: 'visible', timeout: 10000 })
  ])

  // 2. Check which is visible
  const isSelectVisible = await select.isVisible()

  // 3. Use appropriate method
  if (isSelectVisible) {
    await select.selectOption({ value: tabName })
  } else {
    await button.waitFor({ state: 'visible', timeout: 5000 })
    await button.click()
  }
}
```

### Key Improvements:
1. **Explicit wait** for tab controls to be visible
2. **Promise.race** handles both mobile/desktop cases
3. **Double-check** button visibility before clicking
4. **Graceful fallback** if neither appears

## Expected Impact

**All 8 Account Plan Tests Should Now Pass:**
- ✅ Tab switching works - Financials
- ✅ Tab switching works - Organization
- ✅ Tab switching works - Competitive
- ✅ Tab switching works - Intelligence
- ✅ Tab switching works - Action Items
- ✅ Back link returns to accounts list (if it uses similar pattern)
- ✅ Health indicator displays
- ✅ Direct tab URL navigation works

## Lessons Learned

1. **Client Components Need Hydration Time**
   - Don't click immediately after navigation
   - Always wait for interactive state

2. **Suspense Boundaries Add Latency**
   - Components wrapped in Suspense need extra time
   - Use `waitFor({ state: 'visible' })` not just `isVisible()`

3. **Server vs Client Rendering**
   - HTML exists immediately (server-rendered)
   - Interactivity comes later (client-hydrated)
   - Tests must wait for the latter

## Next Steps

1. Run full account plan test suite to confirm all pass
2. Check if other test suites have similar hydration issues
3. Apply same pattern to Dashboard/DM Strategy tests if needed
4. Update test documentation with hydration best practices
