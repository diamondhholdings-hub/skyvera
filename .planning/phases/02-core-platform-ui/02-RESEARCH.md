# Phase 2: Core Platform UI - Research

**Researched:** 2026-02-08
**Domain:** Next.js 15 App Router, React 19, Enterprise Dashboard UI
**Confidence:** HIGH

## Summary

Phase 2 builds user-facing dashboard UI on top of the Phase 1 foundation (semantic layer, Claude orchestration, data adapters). The standard approach for enterprise financial dashboards in 2026 is Next.js 15 App Router with React 19 Server Components as the default, using client components only for interactive widgets. The established pattern uses TanStack Table for data grids, Recharts for financial charts, and Tailwind CSS v4 for styling with component composition following the server-first architecture.

Key architectural decisions:
- **Server-first architecture**: Dashboard pages are Server Components by default, fetching data directly from the semantic layer without API routes
- **Streaming UI**: Use loading.tsx and Suspense boundaries to progressively render dashboard sections as data becomes available
- **Headless components**: TanStack Table and Recharts provide logic without dictating UI, allowing full Tailwind customization
- **Health scoring visualization**: Red/yellow/green indicators with icons (never color alone) for accessibility

**Primary recommendation:** Build dashboard pages as Server Components fetching data from SemanticResolver, wrap interactive elements (search, filters, sorting) in granular Client Components marked with "use client", and use TanStack Table + Recharts for data visualization with Tailwind v4 styling.

## Standard Stack

The established libraries/tools for Next.js 15 enterprise dashboards:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | App Router framework | Industry standard for React SSR/SSG, streaming support, file-based routing |
| React | 19.x | UI library | Server Components stable in 19, improved streaming/suspense |
| TypeScript | 5.x | Type safety | Required for enterprise apps, catches errors at build time |
| Tailwind CSS | 4.x | Styling framework | Utility-first, zero-runtime, v4 has Oxide engine for speed |
| Zod | 4.x | Schema validation | Already in Phase 1, validates all data from semantic layer |

### Data Visualization
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Table | 8.21+ | Headless data table | Account lists, any tabular data with sorting/filtering/pagination |
| Recharts | 2.x | React chart library | Financial charts (line, bar, area), KPI visualizations, trend displays |

### UI Components
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | Latest | Toast notifications | Success/error messages, background task completion |
| Headless UI | 2.x | Accessible components | Modals, dropdowns, tabs (if needed beyond native HTML) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js with react-chartjs-2 | Chart.js is 67% slower with large datasets (>10K points), less React-native |
| TanStack Table | Material React Table | MRT is opinionated with Material UI styling, less customizable |
| Sonner | React-Toastify | React-Toastify has larger bundle, more complex API, Sonner is 2026 standard |
| Tailwind v4 | Styled Components / Emotion | CSS-in-JS has runtime overhead, Tailwind v4 is zero-runtime |

**Installation:**
```bash
npm install @tanstack/react-table recharts sonner
npm install @headlessui/react  # Optional, only if needed for complex modals/dropdowns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx           # Dashboard Server Component
│   │   ├── loading.tsx        # Suspense fallback for entire dashboard
│   │   └── components/
│   │       ├── kpi-card.tsx   # Server Component (static)
│   │       └── kpi-chart.tsx  # Client Component (interactive chart)
│   ├── accounts/
│   │   ├── page.tsx           # Account list Server Component
│   │   ├── loading.tsx        # Account list loading skeleton
│   │   └── components/
│   │       ├── account-table.tsx       # Client Component (sorting/filtering)
│   │       ├── account-search.tsx      # Client Component (debounced search)
│   │       └── health-indicator.tsx    # Server Component (can be reused)
│   └── alerts/
│       ├── page.tsx           # Alerts dashboard Server Component
│       ├── loading.tsx        # Alerts loading state
│       └── components/
│           └── alert-list.tsx  # Server Component with data fetch
├── components/
│   ├── ui/                    # Shared UI components
│   │   ├── badge.tsx          # Server Component
│   │   ├── card.tsx           # Server Component
│   │   └── button.tsx         # Client Component (if interactive)
│   └── charts/                # Chart wrapper components
│       ├── line-chart.tsx     # Client Component
│       ├── bar-chart.tsx      # Client Component
│       └── chart-tooltip.tsx  # Server Component (config only)
└── lib/
    └── (existing foundation from Phase 1)
```

### Pattern 1: Server-First Data Fetching
**What:** Fetch data directly in Server Components without API routes
**When to use:** All dashboard pages, initial data loads
**Example:**
```typescript
// Source: Next.js official docs (https://nextjs.org/docs/app/getting-started/fetching-data)
// app/dashboard/page.tsx - Server Component (default)

import { SemanticResolver } from '@/lib/semantic/resolver'
import { KPICard } from './components/kpi-card'
import { BUBreakdown } from './components/bu-breakdown'

export default async function DashboardPage() {
  const resolver = new SemanticResolver()

  // Fetch data directly - no API route needed
  const financials = await resolver.getConsolidatedFinancials()
  const buSummaries = await resolver.getBUSummaries()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      <KPICard
        title="Total Revenue"
        value={financials.totalRevenue}
        target={financials.revenueTarget}
      />
      <KPICard
        title="EBITDA"
        value={financials.ebitda}
        target={financials.ebitdaTarget}
      />
      <BUBreakdown data={buSummaries} />
    </div>
  )
}
```

### Pattern 2: Streaming with loading.tsx and Suspense
**What:** Show loading UI immediately while data streams in
**When to use:** Any route that fetches data, especially slow queries
**Example:**
```typescript
// Source: Next.js official docs (https://nextjs.org/docs/app/api-reference/file-conventions/loading)
// app/dashboard/loading.tsx

export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

// app/dashboard/page.tsx - Granular Suspense for independent sections
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div className="grid gap-6 p-6">
      <Suspense fallback={<KPISkeleton />}>
        <KPISection />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentAccounts />
      </Suspense>
    </div>
  )
}
```

### Pattern 3: Client Component Islands for Interactivity
**What:** Mark only interactive components with "use client", keep rest as Server Components
**When to use:** Search inputs, filters, sortable tables, charts with tooltips
**Example:**
```typescript
// Source: Next.js official docs (https://nextjs.org/docs/app/getting-started/server-and-client-components)
// app/accounts/components/account-table.tsx - Client Component

'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { CustomerWithHealth } from '@/lib/types/customer'

interface AccountTableProps {
  customers: CustomerWithHealth[] // Data passed from Server Component
}

export function AccountTable({ customers }: AccountTableProps) {
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: customers,
    columns: [
      { accessorKey: 'customer_name', header: 'Customer' },
      { accessorKey: 'rr', header: 'RR', cell: (info) => `$${info.getValue()}` },
      { accessorKey: 'healthScore', header: 'Health', cell: (info) => (
        <HealthIndicator score={info.getValue()} /> // Server Component OK here
      )},
    ],
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search customers..."
        className="mb-4 px-4 py-2 border rounded-lg"
      />
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer px-4 py-2 text-left"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Pattern 4: Debounced Search Input
**What:** Delay search execution until user stops typing
**When to use:** Any search/filter input that could trigger expensive operations
**Example:**
```typescript
// Source: Community best practices (https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b)
// app/accounts/components/account-search.tsx

'use client'

import { useState, useEffect } from 'react'

interface AccountSearchProps {
  onSearch: (query: string) => void
  debounceMs?: number
}

export function AccountSearch({ onSearch, debounceMs = 300 }: AccountSearchProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, onSearch, debounceMs])

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search accounts..."
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    />
  )
}
```

### Pattern 5: Health Score Indicator (Accessible)
**What:** Visual health indicator with color + icon + aria-label
**When to use:** Customer health scores, alert severity, metric status
**Example:**
```typescript
// Source: Accessibility best practices (https://developer.dynatrace.com/design/status-and-health/)
// components/ui/health-indicator.tsx - Server Component (no interactivity)

import type { CustomerWithHealth } from '@/lib/types/customer'

interface HealthIndicatorProps {
  score: 'green' | 'yellow' | 'red'
  label?: string
}

const healthConfig = {
  green: {
    color: 'bg-green-500',
    icon: '✓',
    text: 'Healthy',
    ariaLabel: 'Account health: Good'
  },
  yellow: {
    color: 'bg-yellow-500',
    icon: '⚠',
    text: 'At Risk',
    ariaLabel: 'Account health: Warning'
  },
  red: {
    color: 'bg-red-500',
    icon: '✕',
    text: 'Critical',
    ariaLabel: 'Account health: Critical'
  },
}

export function HealthIndicator({ score, label }: HealthIndicatorProps) {
  const config = healthConfig[score]

  return (
    <div className="flex items-center gap-2" aria-label={config.ariaLabel}>
      <span className={`${config.color} w-3 h-3 rounded-full`} aria-hidden="true" />
      <span className="font-medium">{config.icon}</span>
      <span className="text-sm">{label || config.text}</span>
    </div>
  )
}
```

### Pattern 6: KPI Card with Current vs Target
**What:** Dashboard KPI card showing current value, target, and delta
**When to use:** Financial dashboards, metric displays
**Example:**
```typescript
// Source: Dashboard design patterns (https://nastengraph.substack.com/p/anatomy-of-the-kpi-card)
// app/dashboard/components/kpi-card.tsx - Server Component

interface KPICardProps {
  title: string
  value: number
  target: number
  format?: 'currency' | 'percentage' | 'number'
}

export function KPICard({ title, value, target, format = 'number' }: KPICardProps) {
  const delta = ((value - target) / target) * 100
  const isPositive = delta >= 0

  const formatValue = (val: number) => {
    if (format === 'currency') return `$${(val / 1000000).toFixed(1)}M`
    if (format === 'percentage') return `${val.toFixed(1)}%`
    return val.toLocaleString()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mt-2">
        {formatValue(value)}
      </p>
      <div className="flex items-center gap-2 mt-2 text-sm">
        <span className="text-slate-600">Target: {formatValue(target)}</span>
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
```

### Pattern 7: Recharts Line Chart for Financial Trends
**What:** Financial trend chart with Recharts
**When to use:** Revenue trends, ARR over time, margin analysis
**Example:**
```typescript
// Source: Recharts documentation (https://www.npmjs.com/package/recharts)
// app/dashboard/components/revenue-chart.tsx - Client Component (charts need interactivity)

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: Array<{ quarter: string; revenue: number; target: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="quarter" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Actual Revenue"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Target"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Adding "use client" everywhere:** Only mark interactive components as client. Default to Server Components for better performance
- **Creating API routes for data fetching:** Server Components can fetch directly from semantic layer. API routes add unnecessary network hops
- **Fetching data in Client Components:** Causes waterfall (wait for JS, then fetch), increases TTI. Fetch in Server Components and pass as props
- **Not using loading.tsx:** Missing loading states cause jarring blank screens during navigation
- **Large Client Component bundles:** Keep Recharts, TanStack Table imports in separate client components, not in parent Server Component
- **Using global state for server data:** React 19 context with promises is better than Zustand/Redux for server-fetched data

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable/filterable tables | Custom table with sort/filter logic | TanStack Table v8 | Handles sorting, filtering, pagination, column visibility, virtualization. Custom solutions miss edge cases |
| Financial charts | Canvas-based chart renderer | Recharts 2.x | Handles responsive sizing, tooltips, legends, accessibility. Chart.js slower for large datasets |
| Debounced inputs | setTimeout in onChange | Custom useDebounce hook or library | Avoids memory leaks, cleanup issues, stale closure bugs |
| Health score visualization | Color-only indicators | Badge with icon + color + text | Color alone fails WCAG 2.2. Need redundant encoding (icon, text) |
| Loading skeletons | Manual div + animate-pulse | loading.tsx + Suspense | Automatic streaming, prefetching, interruptible navigation |
| Toast notifications | Custom notification system | Sonner | Zero dependencies, TypeScript-first, handles stacking, dismissal, animations |
| Responsive grids | Media query hell | Tailwind responsive classes | md:, lg:, xl: breakpoints. Container queries in v4 |
| Form validation | Manual validation logic | Zod (already in project) | Type-safe validation, error messages, parse vs safeParse |

**Key insight:** Enterprise dashboards have deceptively complex requirements. Sorting seems simple until you need multi-column sorts with custom comparators. Charts seem simple until you need responsive sizing, accessibility, and touch interactions. Use battle-tested libraries instead of reimplementing.

## Common Pitfalls

### Pitfall 1: Over-Using "use client" Directive
**What goes wrong:** Developers add "use client" to entire page components or large sections, bloating the client bundle and losing Server Component benefits
**Why it happens:** Misunderstanding of Next.js 15 boundaries. One interactive element makes developers mark the entire parent as client
**How to avoid:**
- Default to Server Components for all pages/layouts
- Mark only the specific interactive components (search input, sortable table, chart) with "use client"
- Pass data from Server Components to Client Components via props
- Use composition pattern: Server Component wraps Client Component, passes children
**Warning signs:**
- Bundle size over 500KB for initial page load
- Seeing API routes for simple data fetching
- "use client" at top of page.tsx files

### Pitfall 2: Not Understanding Next.js 15 Caching Changes
**What goes wrong:** Data appears stale because caching behavior changed from Next.js 14 to 15
**Why it happens:** Next.js 15 removed automatic caching for GET requests. Developers expect caching but don't get it
**How to avoid:**
- Explicitly cache with `cache: 'force-cache'` in fetch() calls
- Use React's `cache()` function for deduplication across Server Components
- Set appropriate revalidation with `next: { revalidate: 900 }` (15 min = 900 sec)
- Phase 1 CacheManager handles this at semantic layer, but be aware for direct fetches
**Warning signs:**
- Multiple identical database queries per page render
- Slow page loads despite fast individual queries
- Cache hits not showing in Phase 1 CacheManager metrics

### Pitfall 3: Client-Side Data Fetching Waterfalls
**What goes wrong:** Page loads, then JS loads, then useEffect fires, then data fetches. Users see blank screen for 2-3 seconds
**Why it happens:** Developers familiar with SPA patterns (useEffect + fetch) apply them to Next.js App Router
**How to avoid:**
- Fetch all initial data in Server Components (automatic parallel fetching)
- Use Suspense boundaries to stream data as it arrives
- Only fetch in Client Components for user-triggered actions (search, filter changes)
- Pass server-fetched data to Client Components via props
**Warning signs:**
- Slow "Time to Interactive" metrics
- Console warnings about useEffect dependencies
- Loading spinners appearing after initial page render

### Pitfall 4: Not Implementing Loading States
**What goes wrong:** Navigation feels broken because users see blank screens while data loads
**Why it happens:** Developers forget to create loading.tsx files or Suspense fallbacks
**How to avoid:**
- Create loading.tsx in every route folder that fetches data
- Use Suspense boundaries for independent sections that can load separately
- Design meaningful skeletons that match actual content layout
- Test on slow network (Chrome DevTools > Network > Slow 3G)
**Warning signs:**
- Users reporting "broken" navigation
- Blank white screens during route transitions
- No visual feedback when clicking links

### Pitfall 5: Ignoring Accessibility for Health Indicators
**What goes wrong:** Color-blind users or screen reader users cannot understand health scores
**Why it happens:** Developers use only color (red/yellow/green) without redundant encoding
**How to avoid:**
- Always combine color with icon AND text label
- Add aria-label with full context ("Account health: Critical")
- Use aria-hidden="true" on decorative color dots
- Test with screen reader (MacOS VoiceOver, NVDA on Windows)
- Follow WCAG 2.2 Level AA (color alone is not sufficient)
**Warning signs:**
- Color-only badges or indicators
- Missing aria-labels on status elements
- Screen reader reads "green" instead of "healthy"

### Pitfall 6: Recharts Performance with Large Datasets
**What goes wrong:** Charts freeze or lag when rendering >1000 data points
**Why it happens:** Recharts renders every point even if not visible. No virtualization by default
**How to avoid:**
- Aggregate data server-side before passing to chart (e.g., daily -> monthly for long timeframes)
- Limit data points to reasonable display size (50-100 for line charts, 20-30 for bar charts)
- Use ResponsiveContainer with fixed height to prevent layout thrashing
- Consider canvas-based library (Chart.js) only if >10K points required (rare for financial dashboards)
**Warning signs:**
- Chart component takes >500ms to render
- Browser dev tools show long scripting time
- Chart animation is janky or skips frames

### Pitfall 7: Not Debouncing Search/Filter Inputs
**What goes wrong:** Every keystroke triggers expensive filtering/searching, causing UI lag
**Why it happens:** Developers wire onChange directly to filter function without delay
**How to avoid:**
- Implement useDebounce hook with 300ms delay for search inputs
- Use useMemo for expensive filtering calculations
- Show visual feedback (spinner) during debounce delay
- TanStack Table has built-in debouncing for global filter
**Warning signs:**
- Typing in search box feels sluggish
- React DevTools Profiler shows many re-renders
- Filter function called 10+ times for single word typed

### Pitfall 8: Context Providers Too High in Tree
**What goes wrong:** Theme or notification providers at root layout force everything to be client-rendered
**Why it happens:** Developers follow old React patterns (wrap entire app in providers)
**How to avoid:**
- Place providers as deep in tree as possible (in specific layouts, not root)
- Use Server Components for everything above provider boundary
- For root-level providers, create separate client component file marked with "use client"
- Next.js 15 optimizes when providers are deeper
**Warning signs:**
- Entire app marked as "use client" boundary
- Large client bundle despite mostly static content
- Loss of streaming benefits

## Code Examples

Verified patterns from official sources:

### Example 1: Complete Dashboard Page with Streaming
```typescript
// Source: Next.js App Router documentation
// app/dashboard/page.tsx - Server Component

import { Suspense } from 'react'
import { SemanticResolver } from '@/lib/semantic/resolver'
import { KPICard } from './components/kpi-card'
import { RevenueChart } from './components/revenue-chart'
import { BUBreakdown } from './components/bu-breakdown'
import { RecentAlerts } from './components/recent-alerts'

// Server Component fetches data directly
async function KPISection() {
  const resolver = new SemanticResolver()
  const financials = await resolver.getConsolidatedFinancials()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Revenue"
        value={financials.totalRevenue}
        target={financials.revenueTarget}
        format="currency"
      />
      <KPICard
        title="Net Margin"
        value={financials.netMarginPct}
        target={financials.netMarginTarget}
        format="percentage"
      />
      <KPICard
        title="EBITDA"
        value={financials.ebitda}
        target={financials.ebitdaTarget}
        format="currency"
      />
      <KPICard
        title="Recurring Revenue"
        value={financials.totalRR}
        target={financials.rrTarget}
        format="currency"
      />
    </div>
  )
}

async function ChartSection() {
  const resolver = new SemanticResolver()
  const trendData = await resolver.getRevenueTrend()

  return <RevenueChart data={trendData} />
}

async function BUSection() {
  const resolver = new SemanticResolver()
  const buSummaries = await resolver.getBUSummaries()

  return <BUBreakdown data={buSummaries} />
}

async function AlertsSection() {
  const resolver = new SemanticResolver()
  const alerts = await resolver.getProactiveAlerts()

  return <RecentAlerts alerts={alerts} />
}

// Main page composes sections with Suspense boundaries
export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Executive Dashboard</h1>

      <Suspense fallback={<div className="h-32 bg-slate-200 animate-pulse rounded-lg" />}>
        <KPISection />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-80 bg-slate-200 animate-pulse rounded-lg" />}>
          <ChartSection />
        </Suspense>

        <Suspense fallback={<div className="h-80 bg-slate-200 animate-pulse rounded-lg" />}>
          <BUSection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-64 bg-slate-200 animate-pulse rounded-lg" />}>
        <AlertsSection />
      </Suspense>
    </div>
  )
}
```

### Example 2: Complete Account List with Search and Table
```typescript
// Source: TanStack Table + Next.js App Router patterns
// app/accounts/page.tsx - Server Component

import { SemanticResolver } from '@/lib/semantic/resolver'
import { AccountTable } from './components/account-table'

export default async function AccountsPage() {
  const resolver = new SemanticResolver()
  const customers = await resolver.getAllCustomersWithHealth()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Customer Accounts</h1>
      <AccountTable customers={customers} />
    </div>
  )
}

// app/accounts/components/account-table.tsx - Client Component
'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { HealthIndicator } from '@/components/ui/health-indicator'
import type { CustomerWithHealth } from '@/lib/types/customer'

interface AccountTableProps {
  customers: CustomerWithHealth[]
}

export function AccountTable({ customers }: AccountTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<CustomerWithHealth>[]>(() => [
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: (info) => (
        <div className="font-medium text-slate-900">{info.getValue() as string}</div>
      ),
    },
    {
      accessorKey: 'rr',
      header: 'Recurring Revenue',
      cell: (info) => {
        const value = info.getValue() as number
        return <span>${(value / 1000).toFixed(0)}K</span>
      },
    },
    {
      accessorKey: 'nrr',
      header: 'Non-Recurring Revenue',
      cell: (info) => {
        const value = info.getValue() as number
        return <span>${(value / 1000).toFixed(0)}K</span>
      },
    },
    {
      accessorKey: 'total',
      header: 'Total Revenue',
      cell: (info) => {
        const value = info.getValue() as number
        return <span className="font-semibold">${(value / 1000).toFixed(0)}K</span>
      },
    },
    {
      accessorKey: 'healthScore',
      header: 'Health',
      cell: (info) => <HealthIndicator score={info.getValue() as 'green' | 'yellow' | 'red'} />,
    },
  ], [])

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search customers by name..."
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span>{header.column.getIsSorted() === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-slate-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-slate-600">
        Showing {table.getRowModel().rows.length} of {customers.length} customers
      </div>
    </div>
  )
}
```

### Example 3: Proactive Alerts Dashboard
```typescript
// Source: Enterprise dashboard patterns
// app/alerts/page.tsx - Server Component

import { SemanticResolver } from '@/lib/semantic/resolver'
import { AlertCard } from './components/alert-card'

export default async function AlertsPage() {
  const resolver = new SemanticResolver()
  const alerts = await resolver.getProactiveAlerts()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Proactive Alerts</h1>
        <p className="text-slate-600 mt-2">At-risk accounts and metric anomalies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No active alerts. All metrics within expected ranges.
        </div>
      )}
    </div>
  )
}

// app/alerts/components/alert-card.tsx - Server Component (no interactivity needed)
import { HealthIndicator } from '@/components/ui/health-indicator'

interface Alert {
  id: string
  severity: 'red' | 'yellow'
  title: string
  description: string
  accountName?: string
  metricName: string
  currentValue: number
  threshold: number
  timestamp: Date
}

interface AlertCardProps {
  alert: Alert
}

export function AlertCard({ alert }: AlertCardProps) {
  const severityColor = alert.severity === 'red' ? 'border-red-500' : 'border-yellow-500'
  const severityBg = alert.severity === 'red' ? 'bg-red-50' : 'bg-yellow-50'

  return (
    <div className={`bg-white border-l-4 ${severityColor} rounded-lg shadow-sm p-6 ${severityBg}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <HealthIndicator score={alert.severity} label="" />
            <h3 className="font-semibold text-slate-900">{alert.title}</h3>
          </div>
          <p className="text-sm text-slate-600 mb-3">{alert.description}</p>

          {alert.accountName && (
            <div className="text-sm">
              <span className="text-slate-500">Account:</span>{' '}
              <span className="font-medium text-slate-900">{alert.accountName}</span>
            </div>
          )}

          <div className="text-sm mt-2">
            <span className="text-slate-500">{alert.metricName}:</span>{' '}
            <span className="font-medium text-slate-900">{alert.currentValue}</span>
            <span className="text-slate-500"> (threshold: {alert.threshold})</span>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          {new Date(alert.timestamp).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach (2024) | Current Approach (2026) | When Changed | Impact |
|---------------------|-------------------------|--------------|--------|
| Pages Router with getServerSideProps | App Router with Server Components | Next.js 13 (stable in 15) | Simpler data fetching, better streaming, no need for separate API routes |
| Client-side only tables (react-table v7) | TanStack Table v8 (headless) | 2023 | More flexible, no built-in UI assumptions, works with any styling |
| useEffect + fetch in components | Async Server Components | React 19 | Eliminates waterfalls, reduces client JS, improves TTI |
| Chart.js for all charts | Recharts for React apps | 2025-2026 trend | Better React integration, 67% faster for large datasets, composable components |
| Styled Components / Emotion | Tailwind CSS v4 | Tailwind v4 release | Zero-runtime CSS, faster builds with Oxide engine, better DX |
| React Context for all state | Server Component props + client useState | React 19 pattern | Less client JS, simpler data flow, context only where needed |
| Manual loading states | loading.tsx + Suspense | Next.js 13 App Router | Automatic streaming, prefetching, better UX |
| Separate toast libraries | Sonner (2026 standard) | 2025-2026 | TypeScript-first, zero deps, modern API, works with Server Actions |

**Deprecated/outdated:**
- **Pages Router (pages/ directory)**: Still supported but App Router (app/ directory) is the future. All new projects should use App Router
- **getServerSideProps / getStaticProps**: Replaced by async Server Components with direct data fetching
- **API routes for data fetching**: Unnecessary with Server Components. Only use API routes for external webhooks or client-triggered mutations (though Server Actions are often better)
- **useEffect for initial data loading**: Anti-pattern in App Router. Fetch in Server Components instead
- **react-table v7**: TanStack Table v8 is the renamed, rewritten successor with better API
- **React 18 Suspense workarounds**: React 19 Suspense is stable, no more experimental flags needed
- **Custom debounce implementations**: Use established patterns or libraries, avoid reinventing

## Open Questions

Things that couldn't be fully resolved:

1. **Chart.js vs Recharts performance claims**
   - What we know: Multiple sources claim Recharts is 67% faster for large datasets, but testing methodology unclear
   - What's unclear: Exact dataset size threshold where Recharts becomes significantly better. "10K points" mentioned but not verified
   - Recommendation: Start with Recharts (better React integration). Financial dashboards rarely have >1000 points per chart. Monitor performance in Phase 5

2. **Tailwind CSS v4 production readiness**
   - What we know: Project already has Tailwind v4 (4.1.18) installed. Official release happened recently
   - What's unclear: Edge cases or breaking changes from v3 that might affect dashboard layouts
   - Recommendation: Proceed with v4 as installed. It's stable and faster. Document any issues found during Phase 2

3. **React 19 Server Components with Prisma**
   - What we know: Phase 1 uses Prisma with SQLite. Server Components can query directly
   - What's unclear: Best pattern for Prisma client initialization in Server Components (singleton vs per-request)
   - Recommendation: Follow Phase 1's pattern (likely uses singleton). If performance issues, investigate per-request pooling

4. **Sonner toast notifications with Server Actions**
   - What we know: Sonner is 2026 standard for toasts. Server Actions can return data to trigger toasts
   - What's unclear: Best pattern for showing toasts after Server Action completes (client-side handling)
   - Recommendation: Research during implementation. Likely: Server Action returns result, Client Component shows toast based on result

5. **Mobile responsiveness priority**
   - What we know: REQUIREMENTS.md lists "Mobile-optimized interface" as out of scope
   - What's unclear: Does "out of scope" mean completely ignore mobile, or just don't prioritize it?
   - Recommendation: Use Tailwind responsive classes (md:, lg:) by default since they're nearly free. Don't spend time on mobile-specific features, but don't break mobile either

## Sources

### Primary (HIGH confidence)
- [Next.js App Router Official Docs - Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Verified patterns for composition, when to use each
- [Next.js App Router Official Docs - Data Fetching](https://nextjs.org/docs/app/getting-started/fetching-data) - Server Component data fetching patterns
- [Next.js App Router Official Docs - loading.tsx](https://nextjs.org/docs/app/api-reference/file-conventions/loading) - Loading states and Suspense integration
- [TanStack Table Official Docs](https://tanstack.com/table/latest) - v8 features, installation, headless concept
- [Recharts NPM Package](https://www.npmjs.com/package/recharts) - Installation and basic usage

### Secondary (MEDIUM confidence)
- [Next.js 15 App Router Best Practices](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji) - Organization patterns verified with official docs
- [React Server Components Guide 2026](https://www.grapestechsolutions.com/blog/react-server-components-explained/) - RSC benefits, confirmed with official React docs
- [Recharts vs Chart.js Performance Comparison](https://www.oreateai.com/blog/recharts-vs-chartjs-navigating-the-performance-maze-for-big-data-visualizations/4aff3db4085050dc635fd25267846922) - Performance claims (67% faster)
- [Top React Chart Libraries 2026](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries) - Recharts recommendation for React apps
- [React Notification Libraries 2026](https://knock.app/blog/the-top-notification-libraries-for-react) - Sonner as 2026 standard
- [TanStack Table Complete Guide](https://www.contentful.com/blog/tanstack-table-react-table/) - Usage patterns and examples
- [KPI Card Anatomy](https://nastengraph.substack.com/p/anatomy-of-the-kpi-card) - Dashboard design patterns for current vs target

### Tertiary (LOW confidence - need validation)
- [Next.js Performance Mistakes](https://medium.com/@sureshdotariya/10-performance-mistakes-in-next-js-16-that-are-killing-your-app-and-how-to-fix-them-2facfab26bea) - Common pitfalls, some unverified
- [React Performance Optimization 2026](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9) - useMemo best practices, some subjective
- [Debounce React Search](https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b) - Implementation pattern, needs testing
- [Dashboard Accessibility Patterns](https://webaim.org/blog/2026-predictions/) - WCAG 2026 predictions, not yet requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs for Next.js, React, TanStack Table, Recharts all verified. These are established libraries
- Architecture: HIGH - Next.js App Router patterns from official docs. Server Component composition verified with multiple sources
- Pitfalls: MEDIUM - Common mistakes compiled from multiple sources and official docs, but some based on community experience
- Performance claims: MEDIUM - Recharts vs Chart.js performance difference cited by multiple sources but not independently verified
- Sonner adoption: MEDIUM - Multiple 2026 sources cite as standard, but adoption rate not quantified

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - Next.js/React ecosystem is stable, no major releases expected soon)

**Notes for planner:**
- Phase 1 foundation (semantic layer, types, Prisma) is solid base for UI layer
- Server Components are default - only mark interactive parts as "use client"
- TanStack Table + Recharts are headless - full control over styling with Tailwind
- loading.tsx + Suspense handle streaming automatically
- Health indicators need icon + color + text for accessibility
- Avoid API routes - fetch directly in Server Components from semantic layer
