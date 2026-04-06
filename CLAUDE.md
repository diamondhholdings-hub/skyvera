# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository is **both** a business analysis tool and a full AI-powered executive intelligence platform for Skyvera, a multi-business unit SaaS company with three primary verticals:
- **Cloudsense** - Largest BU by revenue (~$8M quarterly)
- **Kandy** - Mid-size BU (~$3.3M quarterly)
- **STL (Software Technology Labs)** - Smaller BU (~$1M quarterly)

### Platform (Next.js App)
- **Stack:** Next.js 16 + TypeScript + Tailwind + Prisma (SQLite) + Claude Sonnet 4.6
- **Deployed:** https://skyvera.vercel.app
- **Repo:** https://github.com/diamondhholdings-hub/skyvera.git
- **Pages:** dashboard, /accounts, /accounts/[name] (8-tab), /query, /scenario, /dm-strategy, /alerts
- **API routes:** `src/app/api/` — 22 routes covering query, scenarios, dm-strategy, enrichment, account chat, account plan CRUD
- **Intelligence layer:** `src/lib/intelligence/` — Claude orchestrator (50 RPM, priority queue, cache), NLQ engine, scenario calculator, DM strategy engine
- **Data layer:** `src/lib/data/` — Excel parser, RapidAPI ×5 adapters, server-side fetchers
- **Test suite:** Playwright smoke + E2E (`tests/`), Vitest unit tests (`tests/unit/`)

### Business Analysis Files
The repository also contains the original financial analysis files:
- Excel budget file: `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`
- `Business_Analysis_Dashboard.html` — standalone Chart.js executive dashboard

## Platform Architecture

```
src/app/              Next.js App Router pages + API routes
src/components/       Shared UI components (ErrorBoundary, PageHeader, etc.)
src/lib/
  intelligence/       Claude orchestrator, NLQ, scenarios, DM strategy
  data/               Adapters (Excel, RapidAPI ×5), server fetchers
  middleware/         Rate limiter (in-memory, per-IP)
  validation/         Zod schemas for API input validation
  cache/              Cache manager (DEMO_MODE aware, jitter support)
  semantic/           Financial metric resolver (ARR, EBITDA, etc.)
  errors/             Error types + Result pattern
data/
  intelligence/       OSINT reports for 140 accounts
  enrichment/         RapidAPI cache (JSON per account slug)
  account-plans/      strategy/, actions/, stakeholders/ per account
prisma/               SQLite schema (Customer, Subscription, DMRecommendation)
tests/
  smoke/              Playwright smoke tests (fast, no server needed)
  e2e/                Playwright E2E tests (full demo flows)
  unit/               Vitest unit tests (business logic)
.github/workflows/    CI: type-check + build + smoke tests on every PR
```

## Key Patterns

- **Result type** for error handling — no thrown exceptions at data boundaries (`src/lib/types/result.ts`)
- **Server Components** fetch data; **Client Components** (`"use client"`) handle interactivity
- **ErrorBoundary** (`src/components/ui/error-boundary.tsx`) wraps high-risk client components
- **Rate limiting** (`src/lib/middleware/rate-limit.ts`) — in-memory per-IP sliding window; Claude routes 10-20 req/min, enrich 5 req/min; returns 429 + `{ error, retryAfter }`
- **Zod validation** (`src/lib/validation/schemas.ts`) — at all API entry points; returns 400 + `issues` array on failure
- **ClaudeOrchestrator** singleton — 50 RPM, priority queue, cache, exponential backoff
- **URL-based tab state** (`?tab=overview`) — bookmarkable account detail pages
- **DEMO_MODE** env flag — extends cache TTLs (30min vs 5min)
- **RapidAPI degraded mode** — missing `RAPIDAPI_KEY` returns `ok({ data: [] })` not `err()`; pipeline marks sections `skipped` not `error`
- **OpenCorporates degraded mode** — same pattern; missing key → graceful skip, never blocks pipeline
- **healthCheck()** on all external adapters returns `!this.degraded` (not hardcoded `true`)
- Enrichment errors: distinguish ENOENT (return null) from real errors (log + return null)
- Print/PDF: `@media print` hides `[data-print="hide"]` elements, A4, `-webkit-print-color-adjust: exact`
- Data completeness score: 7-dimension 0-100 scale
- Search on accounts page: server-side filtered via `?search=` searchParam (bookmarkable)
- Event handlers ILLEGAL in Server Components — use CSS `:hover` via `<style>` tag + className
- `arr: customer.rr` alias in `src/lib/semantic/resolver.ts` — field name is misleading; values are already annual (known gotcha, documented)

## Testing

```bash
# Unit tests (Vitest) — business logic, adapters, middleware
npm run test:unit          # 161 tests across 9 files

# Smoke tests (Playwright) — UI behavior, no external APIs needed
npx playwright test tests/smoke/    # 49 tests across 6 files

# E2E tests (Playwright) — full demo flows, requires running dev server
npx playwright test tests/e2e/

# Run all
npm run test:unit && npx playwright test tests/smoke/
```

CI runs type-check + build + smoke tests automatically on every PR via `.github/workflows/ci.yml`.

## Key Files

### Budget Data
- **`2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`** - Master budget file containing:
  - Multiple business unit P&Ls (Cloudsense, Kandy, STL)
  - Recurring Revenue (RR) and Non-Recurring Revenue (NRR) forecasts
  - Headcount (HC) budget and planning
  - Vendor cost analysis
  - Accounts Receivable (AR) aging analysis
  - Margin target tracking

### Dashboards
- **`Business_Analysis_Dashboard.html`** - Interactive executive dashboard
  - Self-contained HTML file with Chart.js for visualizations
  - No build process required - open directly in browser
  - Displays KPIs, BU performance, cost breakdowns, and strategic recommendations

## Working with Excel Budget Files

When analyzing the Excel file, key sheets include:
- **P&Ls** - Consolidated profit & loss statement
- **P&Ls - Cloudsense/Kandy/STL** - Business unit specific P&Ls
- **RR Summary** - Recurring revenue analysis with ARR calculations and decline metrics
- **NRR Summary** - Non-recurring revenue tracking
- **HC Budget Input** - Headcount planning with XO contractor data
- **Vendor Pivots** - Vendor cost analysis (watch for large contracts like Salesforce UK: $4.1M annual)
- **AR Aging** - Accounts receivable > 90 days (critical for revenue recognition)

### Reading Excel Data with Python

Use `openpyxl` library for Excel file manipulation:

```python
from openpyxl import load_workbook

file_path = "2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx"
wb = load_workbook(file_path, data_only=True)  # data_only=True for calculated values

# Access specific sheet
ws = wb['P&Ls']

# Iterate through rows
for row in ws.iter_rows(values_only=True):
    print(row)
```

**Important:** Install openpyxl first: `pip3 install openpyxl`

## Dashboard Operations

### Opening the Dashboard
```bash
open Business_Analysis_Dashboard.html
```

### Modifying Dashboard Data
The dashboard has hardcoded data in the JavaScript section at the bottom of the HTML file. To update:
1. Locate the Chart.js configuration objects
2. Update the `data` arrays with new values from Excel analysis
3. Ensure labels and datasets remain synchronized

Key metrics embedded in dashboard:
- Total Revenue: $14.7M
- Recurring Revenue: $12.6M (86% of total)
- Net Margin: 62.5% (target: 68.7%)
- EBITDA: $9.2M
- Headcount: 58 FTEs

## Business Context & Critical Metrics

### Key Financial Issues (Q1'26)
1. **FY'25 EBITDA Test: FAILED** - Primary concern requiring immediate investigation
2. **RR Declining -$336K** - Recurring revenue contraction vs. prior plan
3. **Margin Gap: -$918K** - Missing target by 6.2 percentage points
4. **AR > 90 Days: $1.28M** - Collection/churn risk
5. **Salesforce UK Contract: $4.1M/year** - Largest vendor cost (64% of Cloudsense Q1'26 revenue)

### Business Unit Margins
- **Cloudsense**: 59.2% net margin (target: 63.6%)
- **Kandy**: 63.2% net margin (target: 75%)
- **STL**: 61.2% net margin (target: 75%)

### Cost Structure
- COGS: 21% of revenue
- Headcount: 8% (but increasing rapidly)
- Vendor/CF costs: 43% (Salesforce UK dominates)
- Core Allocation: 17%

## Analysis Workflow

When analyzing the business:

1. **Extract data from Excel** using Python/openpyxl
2. **Focus on key sheets**: P&Ls, RR Summary, Vendor Pivots, HC Budget Input
3. **Compare Q1'26 Plan vs Prior Plan** columns to identify variances
4. **Calculate key ratios**: Gross Margin, Net Margin, RR as % of Total Revenue
5. **Identify top cost drivers** from Vendor Pivots (anything >$50K/quarter)
6. **Update dashboard** with new metrics if needed

## Financial Terminology

- **RR (Recurring Revenue)**: Predictable subscription revenue, the foundation metric
- **NRR (Non-Recurring Revenue)**: One-time revenue (services, licenses)
- **ARR (Annual Recurring Revenue)**: RR × 4 quarters
- **DM% (Decline/Maintenance Rate)**: Natural attrition rate for RR
- **EBITDA**: Earnings before interest, taxes, depreciation, amortization
- **HC (Headcount)**: Full-time employee count and costs
- **NHC (Non-Headcount)**: Non-salary expenses
- **CF (Cash Flow/Vendor)**: Vendor and contractor costs
- **AR > 90 days**: Aged receivables indicating collection risk

## Python Environment

Recommended packages for analysis:
```bash
pip3 install openpyxl  # Excel file reading
```

Note: `pandas` is NOT currently installed but can be added if needed for more complex data manipulation.
