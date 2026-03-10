# Account Plan Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild all account plan tabs to match the Telstra reference HTML — premium cards, interactive Recharts charts, expandable accordions, visual zigzag timeline, org-node hierarchy, and 8-tab structure.

**Architecture:** Replace 3 old tab components with 4 new ones. Upgrade 4 existing tabs. Add 3 Recharts chart components. Extend 2 data types. Update tab navigation and page routing. Intelligence tab kept as-is (already well-built).

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Recharts (installed), Lucide React, CSS custom properties (`--ink`, `--paper`, `--accent`, `--secondary`, `--highlight`, `--border`, `--muted`)

**Reference:** `Telstra_Account_Plan_Interactive.html` at project root — exact visual spec.

**Design tokens in use:**
- `--accent: #c84b31` (red), `--secondary: #2d4263` (navy), `--highlight: #ecdbba` (warm tan)
- `--border: #e8e6e1`, `--muted: #8b8b8b`, `--paper: #fafaf8`, `--ink: #1a1a1a`
- Display font: `Cormorant Garamond` (via `font-display` class), Body: `DM Sans`

---

## Chunk 1: Foundation — Types + Navigation + Routing

### Task 1: Extend data types

**Files:**
- Modify: `src/lib/types/account-plan.ts`
- Modify: `src/lib/types/customer.ts`

- [ ] **Step 1: Add optional fields to Stakeholder, PainPoint, Competitor in account-plan.ts**

In `StakeholderSchema`, add after `notes`:
```typescript
keyMessage: z.string().optional(),
```

In `PainPointSchema`, add after `owner`:
```typescript
cloudSenseSolution: z.string().optional(),
nextAction: z.string().optional(),
```

In `CompetitorSchema`, add after `lastUpdated`:
```typescript
threatLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
customerSponsor: z.string().optional(),
nextActionToDefend: z.string().optional(),
```

- [ ] **Step 2: Add optional date fields to Subscription in customer.ts**

In `SubscriptionSchema`, add after `projected_arr`:
```typescript
startDate: z.string().optional(),
endDate: z.string().optional(),
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/RAZER/Documents/projects/Skyvera && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors (new fields are optional, fully backward-compatible)

- [ ] **Step 4: Commit**
```bash
git add src/lib/types/account-plan.ts src/lib/types/customer.ts
git commit -m "feat(types): add keyMessage, cloudSenseSolution, nextAction, threatLevel, startDate, endDate fields"
```

---

### Task 2: Update tab navigation to 8 tabs

**Files:**
- Modify: `src/app/accounts/[name]/_components/tab-navigation.tsx`

- [ ] **Step 1: Replace TABS array**

Replace the entire `TABS` constant:
```typescript
const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'key-executives', label: '👔 Key Executives' },
  { id: 'org-structure', label: '🏢 Org Structure' },
  { id: 'pain-points', label: '💡 Pain Points' },
  { id: 'competitive', label: '⚔️ Competitive' },
  { id: 'action-plan', label: '📋 Action Plan' },
  { id: 'financials', label: '💰 Financial' },
  { id: 'intelligence', label: '🧠 Intelligence' },
]
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/accounts/[name]/_components/tab-navigation.tsx
git commit -m "feat(nav): update account plan to 8-tab structure"
```

---

### Task 3: Update page.tsx routing for new tabs

**Files:**
- Modify: `src/app/accounts/[name]/page.tsx`

- [ ] **Step 1: Update imports — add new components, remove old**

Replace old imports:
```typescript
// REMOVE these imports:
import { StrategyTab } from './_components/strategy-tab'
import { OrganizationTab } from './_components/organization-tab'
import { ActionItemsTab } from './_components/action-items-tab'

// ADD these imports:
import { KeyExecutivesTab } from './_components/key-executives-tab'
import { OrgStructureTab } from './_components/org-structure-tab'
import { PainPointsTab } from './_components/pain-points-tab'
import { ActionPlanTab } from './_components/action-plan-tab'
```

- [ ] **Step 2: Update tab rendering in the JSX**

Replace the entire tab content section (the `{/* Tab Content */}` div) with:
```tsx
{/* Tab Content */}
<div className="max-w-[1400px] mx-auto px-8 py-6">
  {activeTab === 'overview' && (
    <Suspense fallback={<TabSkeleton />}>
      <OverviewTab
        customer={customer}
        intelligenceReport={accountData.intelligence.raw}
        painPoints={accountData.strategy.painPoints}
        opportunities={accountData.strategy.opportunities}
        allBuCustomers={customersResult.value.filter(c => c.bu === customer.bu)}
      />
    </Suspense>
  )}

  {activeTab === 'key-executives' && (
    <Suspense fallback={<TabSkeleton />}>
      <KeyExecutivesTab stakeholders={accountData.stakeholders} />
    </Suspense>
  )}

  {activeTab === 'org-structure' && (
    <Suspense fallback={<TabSkeleton />}>
      <OrgStructureTab stakeholders={accountData.stakeholders} customerName={customerName} bu={customer.bu} />
    </Suspense>
  )}

  {activeTab === 'pain-points' && (
    <Suspense fallback={<TabSkeleton />}>
      <PainPointsTab
        painPoints={accountData.strategy.painPoints}
        opportunities={accountData.strategy.opportunities}
      />
    </Suspense>
  )}

  {activeTab === 'competitive' && (
    <Suspense fallback={<TabSkeleton />}>
      <CompetitiveTab competitors={accountData.competitors} />
    </Suspense>
  )}

  {activeTab === 'action-plan' && (
    <Suspense fallback={<TabSkeleton />}>
      <ActionPlanTab
        actions={accountData.actions}
        stakeholders={accountData.stakeholders}
      />
    </Suspense>
  )}

  {activeTab === 'financials' && (
    <Suspense fallback={<TabSkeleton />}>
      <FinancialsTab
        customer={customer}
        allBuCustomers={customersResult.value.filter(c => c.bu === customer.bu)}
      />
    </Suspense>
  )}

  {activeTab === 'intelligence' && (
    <Suspense fallback={<TabSkeleton />}>
      <IntelligenceTab
        intelligenceReport={accountData.intelligence}
        news={accountData.news}
        customerName={customerName}
        enrichment={accountData.enrichment ?? null}
      />
    </Suspense>
  )}
</div>
```

- [ ] **Step 3: TypeScript check** (will fail until new components exist — that's expected)
```bash
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

- [ ] **Step 4: Commit**
```bash
git add src/app/accounts/[name]/page.tsx
git commit -m "feat(routing): wire 8-tab routing in account plan page"
```

---

## Chunk 2: Chart Components

### Task 4: ARR Breakdown Chart (doughnut)

**Files:**
- Create: `src/components/charts/arr-breakdown-chart.tsx`

- [ ] **Step 1: Create chart component**

```tsx
'use client'

/**
 * ARRBreakdownChart - Doughnut chart showing RR vs NRR split
 * Uses Recharts PieChart with innerRadius for doughnut effect
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ARRBreakdownChartProps {
  rr: number
  nrr: number
}

const COLORS = ['#c84b31', '#2d4263']

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function ARRBreakdownChart({ rr, nrr }: ARRBreakdownChartProps) {
  const data = [
    { name: `Recurring (${formatCurrency(rr)})`, value: rr },
    { name: `Non-Recurring (${formatCurrency(nrr)})`, value: nrr },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        No revenue data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem' }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: '0.8rem', paddingTop: '1rem' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Verify TypeScript**
```bash
npx tsc --noEmit 2>&1 | grep "arr-breakdown" | head -10
```

- [ ] **Step 3: Commit**
```bash
git add src/components/charts/arr-breakdown-chart.tsx
git commit -m "feat(charts): add ARRBreakdownChart doughnut component"
```

---

### Task 5: Revenue Growth Chart (bar — current vs projected per subscription)

**Files:**
- Create: `src/components/charts/revenue-growth-chart.tsx`

- [ ] **Step 1: Create chart component**

```tsx
'use client'

/**
 * RevenueGrowthChart - Bar chart comparing current vs projected ARR per subscription
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Subscription } from '@/lib/types/customer'

interface RevenueGrowthChartProps {
  subscriptions: Subscription[]
}

function formatK(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  return `$${(value / 1_000).toFixed(0)}K`
}

export function RevenueGrowthChart({ subscriptions }: RevenueGrowthChartProps) {
  const data = subscriptions
    .filter(s => s.arr != null && s.arr > 0)
    .slice(0, 8) // cap at 8 bars for readability
    .map((s, i) => ({
      name: s.sub_id ? `Sub ${s.sub_id}` : `Sub ${i + 1}`,
      current: s.arr ?? 0,
      projected: s.projected_arr ?? s.arr ?? 0,
    }))

  if (data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        No subscription data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <Tooltip
          formatter={(value: number) => formatK(value)}
          contentStyle={{ border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem' }}
        />
        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
        <Bar dataKey="current" name="Current ARR" fill="#2d4263" radius={[2, 2, 0, 0]} />
        <Bar dataKey="projected" name="Projected ARR" fill="#c84b31" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/charts/revenue-growth-chart.tsx
git commit -m "feat(charts): add RevenueGrowthChart bar component"
```

---

### Task 6: Top Customers Chart (horizontal bar)

**Files:**
- Create: `src/components/charts/top-customers-chart.tsx`

- [ ] **Step 1: Create chart component**

```tsx
'use client'

/**
 * TopCustomersChart - Horizontal bar chart of top 10 customers in the same BU by ARR
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CustomerWithHealth } from '@/lib/types/customer'

interface TopCustomersChartProps {
  allBuCustomers: CustomerWithHealth[]
  currentCustomerName: string
}

function formatK(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  return `$${(value / 1_000).toFixed(0)}K`
}

export function TopCustomersChart({ allBuCustomers, currentCustomerName }: TopCustomersChartProps) {
  const top10 = [...allBuCustomers]
    .sort((a, b) => (b.rr + b.nrr) - (a.rr + a.nrr))
    .slice(0, 10)
    .map(c => ({
      name: c.customer_name.length > 18 ? c.customer_name.slice(0, 16) + '…' : c.customer_name,
      fullName: c.customer_name,
      arr: c.rr + c.nrr,
      isCurrent: c.customer_name === currentCustomerName,
    }))

  if (top10.length === 0) {
    return (
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        No customer data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top10} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" horizontal={false} />
        <XAxis type="number" tickFormatter={formatK} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <Tooltip
          formatter={(value: number, _name, props) => [formatK(value), props.payload.fullName]}
          contentStyle={{ border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem' }}
        />
        <Bar dataKey="arr" name="ARR" radius={[0, 2, 2, 0]}>
          {top10.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isCurrent ? '#c84b31' : '#2d4263'}
              opacity={entry.isCurrent ? 1 : 0.65}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/charts/top-customers-chart.tsx
git commit -m "feat(charts): add TopCustomersChart horizontal bar component"
```

---

## Chunk 3: Overview Tab + Financials Tab

### Task 7: Rebuild Overview tab with charts

**Files:**
- Modify: `src/app/accounts/[name]/_components/overview-tab.tsx`

- [ ] **Step 1: Rewrite overview-tab.tsx**

```tsx
/**
 * OverviewTab - Telstra-style overview with charts, alert, priorities, account status, risk summary
 * Server Component — chart subcomponents are 'use client' wrapped in Suspense
 */

import { Suspense } from 'react'
import type { CustomerWithHealth } from '@/lib/types/customer'
import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { AlertTriangle, TrendingUp, TrendingDown, Shield } from 'lucide-react'
import { ARRBreakdownChart } from '@/components/charts/arr-breakdown-chart'
import { TopCustomersChart } from '@/components/charts/top-customers-chart'

interface OverviewTabProps {
  customer: CustomerWithHealth
  intelligenceReport: string
  painPoints?: PainPoint[]
  opportunities?: Opportunity[]
  allBuCustomers?: CustomerWithHealth[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  return `$${(value / 1_000).toFixed(0)}K`
}

const priorityLabels = ['#1 Priority', '#2 Priority', '#3 Priority']

export function OverviewTab({
  customer,
  painPoints = [],
  opportunities = [],
  allBuCustomers = [],
}: OverviewTabProps) {
  const arr = customer.rr + customer.nrr
  const hasAlert = customer.healthScore === 'red' || customer.healthScore === 'yellow'
  const topPainPoints = painPoints.slice(0, 3)
  const topOpportunities = opportunities.slice(0, 3)

  const defaultPriorities = [
    { label: '#1 Priority', title: 'Strengthen Executive Engagement' },
    {
      label: '#2 Priority',
      title: customer.subscriptions.length > 0
        ? `Secure ${customer.subscriptions.length} Subscription Renewal${customer.subscriptions.length > 1 ? 's' : ''}`
        : 'Identify Expansion Opportunities',
    },
    { label: '#3 Priority', title: 'Execute Upsell Strategy' },
  ]

  const priorities = topPainPoints.length >= 3
    ? topPainPoints.map((pp, i) => ({ label: priorityLabels[i], title: pp.title }))
    : defaultPriorities

  return (
    <div className="space-y-8">

      {/* Critical Alert Banner */}
      {hasAlert && (
        <div style={{
          background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
          color: 'white',
          padding: '1.5rem 2rem',
          marginBottom: '1rem',
          borderLeft: '4px solid #8b1a1a',
          boxShadow: '0 4px 12px rgba(197,75,49,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} />
            {customer.healthScore === 'red' ? '🚨 ACCOUNT AT RISK — IMMEDIATE ACTION REQUIRED' : '⚠️ ACCOUNT RISK ALERT'}
          </div>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', lineHeight: 1.6 }}>
            {customer.healthScore === 'red'
              ? 'This account requires immediate executive attention. Review risk factors below and escalate to account leadership.'
              : 'This account shows moderate-risk indicators requiring proactive management.'}
            {customer.healthFactors.length > 0 && ` Key concerns: ${customer.healthFactors.slice(0, 2).join(', ')}.`}
          </p>
        </div>
      )}

      {/* Keys to Success — 3 metric boxes */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
          Keys to Success in Next 90 Days
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {priorities.map(({ label, title }) => (
            <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                {label}
              </div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', fontWeight: 600, color: 'var(--secondary)', lineHeight: 1.3 }}>
                {title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col: Account Status + Risk & Opportunity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        {/* Account Status */}
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Account Status</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <tbody>
              {[
                { label: 'Customer', value: customer.customer_name },
                { label: 'Business Unit', value: customer.bu },
                { label: 'Rank', value: customer.rank ? `#${customer.rank}` : '—' },
                { label: customer.rr > 0 ? 'ARR' : 'Annual Rev', value: formatCurrency(arr) },
                { label: 'Health Score', value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1) },
                { label: '% of Revenue', value: customer.pct_of_total != null ? `${customer.pct_of_total.toFixed(2)}%` : '—' },
              ].map(({ label, value }) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem 0.75rem 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600, width: '9rem' }}>
                    {label}
                  </td>
                  <td style={{ padding: '0.75rem 0', color: 'var(--ink)', fontWeight: 500 }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Risk & Opportunity Summary */}
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Risk & Opportunity Summary</h2>
          {painPoints.length > 0 && (
            <>
              <h3 style={{ color: 'var(--critical, #e53935)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Top Risks</h3>
              <ul style={{ marginLeft: '1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                {painPoints.slice(0, 3).map(pp => (
                  <li key={pp.id}><strong>{pp.title}:</strong> {pp.description?.slice(0, 80)}{pp.description?.length > 80 ? '…' : ''}</li>
                ))}
              </ul>
            </>
          )}
          {topOpportunities.length > 0 && (
            <>
              <h3 style={{ color: 'var(--success, #4caf50)', fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Top Opportunities</h3>
              <ul style={{ marginLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                {topOpportunities.map(opp => (
                  <li key={opp.id}>
                    <strong>{opp.title}{opp.estimatedValue ? ` (+${formatCurrency(opp.estimatedValue)})` : ''}:</strong>{' '}
                    {opp.description?.slice(0, 80)}{opp.description?.length > 80 ? '…' : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
          {painPoints.length === 0 && opportunities.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No risk or opportunity data available yet.</p>
          )}
        </div>
      </div>

      {/* 2-col charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>ARR Breakdown</h2>
          <Suspense fallback={<div style={{ height: 300, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <ARRBreakdownChart rr={customer.rr} nrr={customer.nrr} />
          </Suspense>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Top Customers — {customer.bu}</h2>
          <Suspense fallback={<div style={{ height: 320, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <TopCustomersChart allBuCustomers={allBuCustomers} currentCustomerName={customer.customer_name} />
          </Suspense>
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/accounts/[name]/_components/overview-tab.tsx
git commit -m "feat(overview): add charts, keys-to-success metric boxes, risk/opportunity summary"
```

---

### Task 8: Rebuild Financials tab with charts + contract table + impact analysis

**Files:**
- Modify: `src/app/accounts/[name]/_components/financials-tab.tsx`

- [ ] **Step 1: Rewrite financials-tab.tsx**

```tsx
/**
 * FinancialsTab - Full contract table, charts, strategic impact, expansion opportunities
 * Server Component — chart subcomponents are 'use client'
 */

import { Suspense } from 'react'
import type { CustomerWithHealth } from '@/lib/types/customer'
import { RevenueGrowthChart } from '@/components/charts/revenue-growth-chart'
import { TopCustomersChart } from '@/components/charts/top-customers-chart'

interface FinancialsTabProps {
  customer: CustomerWithHealth
  allBuCustomers?: CustomerWithHealth[]
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function BadgeGrowth({ current, projected }: { current: number; projected: number }) {
  if (!projected || !current) return <span style={{ color: 'var(--muted)' }}>—</span>
  const pct = ((projected - current) / current) * 100
  const isPositive = pct >= 0
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '2px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      background: isPositive ? 'var(--success, #4caf50)' : 'var(--critical, #e53935)',
      color: 'white',
    }}>
      {isPositive ? '+' : ''}{pct.toFixed(0)}%
    </span>
  )
}

export function FinancialsTab({ customer, allBuCustomers = [] }: FinancialsTabProps) {
  const totalCurrentARR = customer.subscriptions.reduce((sum, s) => sum + (s.arr ?? 0), 0)
  const totalProjectedARR = customer.subscriptions.reduce((sum, s) => sum + (s.projected_arr ?? s.arr ?? 0), 0)
  const rrPercent = customer.total > 0 ? (customer.rr / customer.total) * 100 : 0
  const nrrPercent = customer.total > 0 ? (customer.nrr / customer.total) * 100 : 0

  // Strategic impact figures
  const buTotal = allBuCustomers.reduce((sum, c) => sum + c.rr + c.nrr, 0)
  const buPct = buTotal > 0 ? (((customer.rr + customer.nrr) / buTotal) * 100).toFixed(1) : '—'

  return (
    <div className="space-y-8">

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: customer.rr > 0 ? 'ARR' : 'Annual Rev', value: formatCurrency(customer.rr > 0 ? customer.rr : customer.nrr), sub: customer.rr > 0 ? 'Annual Recurring Revenue' : 'Non-Recurring Revenue' },
          { label: 'Recurring Revenue', value: formatCurrency(customer.rr), sub: 'Quarterly recurring' },
          { label: 'Non-Recurring', value: formatCurrency(customer.nrr), sub: 'One-time revenue' },
          { label: 'Total Revenue', value: formatCurrency(customer.total), sub: 'Combined this period' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</div>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2rem', fontWeight: 600, color: 'var(--secondary)' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Contract / Subscription Table */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          Contract Summary
        </h2>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                {['Sub ID', 'Start Date', 'End Date', 'Current ARR', 'Projected ARR', 'Growth', 'Renewal', 'Status'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customer.subscriptions.length > 0 ? customer.subscriptions.map((sub, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--highlight)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--secondary)' }}>{sub.sub_id ?? '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{sub.startDate ?? '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{sub.endDate ?? '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--ink)' }}>{sub.arr != null ? formatCurrency(sub.arr) : '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--ink)' }}>{sub.projected_arr != null ? formatCurrency(sub.projected_arr) : '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    {sub.arr && sub.projected_arr
                      ? <BadgeGrowth current={sub.arr} projected={sub.projected_arr} />
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>{sub.renewal_qtr ?? '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '2px',
                      fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: sub.will_renew === 'Yes' ? 'var(--success, #4caf50)' : sub.will_renew?.startsWith('No') ? 'var(--critical, #e53935)' : 'var(--warning, #ff9800)',
                      color: 'white',
                    }}>
                      {sub.will_renew ?? 'TBD'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No subscription data</td></tr>
              )}
            </tbody>
            {customer.subscriptions.length > 1 && (
              <tfoot>
                <tr style={{ background: 'var(--highlight)', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>TOTAL</td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}><strong>{formatCurrency(totalCurrentARR)}</strong></td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}><strong>{formatCurrency(totalProjectedARR)}</strong></td>
                  <td style={{ padding: '1rem' }}><BadgeGrowth current={totalCurrentARR} projected={totalProjectedARR} /></td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Revenue Breakdown bar */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Revenue Breakdown</h2>
        <div style={{ display: 'flex', height: '2rem', borderRadius: 0, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          {rrPercent > 0 && (
            <div style={{ width: `${rrPercent}%`, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
              {rrPercent > 10 && `${rrPercent.toFixed(0)}%`}
            </div>
          )}
          {nrrPercent > 0 && (
            <div style={{ width: `${nrrPercent}%`, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
              {nrrPercent > 10 && `${nrrPercent.toFixed(0)}%`}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'var(--accent)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Recurring Revenue: {formatCurrency(customer.rr)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{rrPercent.toFixed(1)}% of total</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '1rem', height: '1rem', background: 'var(--secondary)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Non-Recurring: {formatCurrency(customer.nrr)}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{nrrPercent.toFixed(1)}% of total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Revenue Growth Projection</h2>
          <Suspense fallback={<div style={{ height: 300, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <RevenueGrowthChart subscriptions={customer.subscriptions} />
          </Suspense>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>Top Customers — {customer.bu}</h2>
          <Suspense fallback={<div style={{ height: 320, background: 'var(--highlight)', opacity: 0.4 }} />}>
            <TopCustomersChart allBuCustomers={allBuCustomers} currentCustomerName={customer.customer_name} />
          </Suspense>
        </div>
      </div>

      {/* Strategic Impact Analysis */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Strategic Impact Analysis</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { label: 'If Account Churned', value: `-${formatCurrency(Math.round((customer.rr + customer.nrr) / 4))}`, sub: 'Quarterly revenue impact' },
            { label: '% of BU Revenue', value: buPct !== '—' ? `${buPct}%` : '—', sub: `Share of ${customer.bu} total` },
            { label: 'Subscription Count', value: `${customer.subscriptions.length}`, sub: 'Active subscriptions tracked' },
            { label: 'Upsell Potential', value: totalProjectedARR > totalCurrentARR ? `+${formatCurrency(totalProjectedARR - totalCurrentARR)}` : '—', sub: 'If projected ARR executes' },
            { label: 'Health Score', value: customer.healthScore.charAt(0).toUpperCase() + customer.healthScore.slice(1), sub: 'Current account health' },
            { label: 'Rank in BU', value: customer.rank ? `#${customer.rank}` : '—', sub: 'By total revenue' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', fontWeight: 600, color: 'var(--secondary)' }}>{value}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/accounts/[name]/_components/financials-tab.tsx
git commit -m "feat(financials): add charts, contract table with growth, strategic impact analysis"
```

---

## Chunk 4: Key Executives Tab + Org Structure Tab

### Task 9: Create Key Executives tab

**Files:**
- Create: `src/app/accounts/[name]/_components/key-executives-tab.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client'

/**
 * KeyExecutivesTab - 4-quadrant decision matrix + expandable executive accordions + relationship table
 * Client Component — uses useState for accordion open/close state
 * Matches Telstra HTML: decision-matrix, expandable sections, relationship actions table
 */

import { useState } from 'react'
import type { Stakeholder } from '@/lib/types/account-plan'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface KeyExecutivesTabProps {
  stakeholders: Stakeholder[]
}

function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles: Record<string, React.CSSProperties> = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: 'var(--muted)', color: 'white' },
  }
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      ...styles[variant],
    }}>
      {children}
    </span>
  )
}

function ExecutiveAccordion({ stakeholder, defaultOpen = false }: { stakeholder: Stakeholder; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const isHighPriority = stakeholder.role === 'champion' || stakeholder.role === 'decision-maker'

  const roleLabel = {
    'champion': 'Internal Champion',
    'decision-maker': 'Decision Maker',
    'influencer': 'Influencer',
    'user': 'End User',
    'blocker': 'Potential Blocker',
  }[stakeholder.role] ?? stakeholder.role

  const roleVariant = {
    'champion': 'success' as const,
    'decision-maker': 'critical' as const,
    'influencer': 'high' as const,
    'user': 'neutral' as const,
    'blocker': 'critical' as const,
  }[stakeholder.role] ?? 'neutral' as const

  const relVariant = {
    'strong': 'success' as const,
    'moderate': 'medium' as const,
    'weak': 'critical' as const,
    'unknown': 'neutral' as const,
  }[stakeholder.relationshipStrength] ?? 'neutral' as const

  return (
    <div style={{
      border: '1px solid var(--border)',
      marginBottom: '0.75rem',
      background: 'white',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '1.25rem 1.5rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          color: 'var(--secondary)',
          background: open ? 'var(--highlight)' : 'white',
          transition: 'background 0.2s ease',
          borderLeft: isHighPriority ? '4px solid var(--accent)' : '4px solid transparent',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--highlight)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'white' }}
      >
        <span>
          {isHighPriority ? '🎯 ' : ''}{stakeholder.name}
          {stakeholder.title && <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>— {stakeholder.title}</span>}
        </span>
        {open ? <ChevronUp size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
      </div>

      {open && (
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Profile table */}
            <div>
              <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem' }}>Profile</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  {[
                    { label: 'Title', value: stakeholder.title || '—' },
                    { label: 'Role', value: <Badge variant={roleVariant}>{roleLabel}</Badge> },
                    { label: 'Relationship', value: <Badge variant={relVariant}>{stakeholder.relationshipStrength}</Badge> },
                    ...(stakeholder.tenure ? [{ label: 'Tenure', value: stakeholder.tenure }] : []),
                    ...(stakeholder.email ? [{ label: 'Email', value: stakeholder.email }] : []),
                    ...(stakeholder.lastInteraction ? [{ label: 'Last Contact', value: stakeholder.lastInteraction }] : []),
                  ].map(({ label, value }) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 1rem 0.6rem 0', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', fontWeight: 600, width: '8rem' }}>{label}</td>
                      <td style={{ padding: '0.6rem 0', color: 'var(--ink)' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Strategic context */}
            <div>
              <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem' }}>Strategic Context</h4>
              {stakeholder.interests && stakeholder.interests.length > 0 && (
                <ul style={{ marginLeft: '1.25rem', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--ink)' }}>
                  {stakeholder.interests.map((interest, i) => (
                    <li key={i}>{interest}</li>
                  ))}
                </ul>
              )}
              {stakeholder.notes && (
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {stakeholder.notes}
                </p>
              )}
              {stakeholder.keyMessage && (
                <div style={{ padding: '1rem', background: 'var(--highlight)', borderLeft: '3px solid var(--accent)', marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: 'var(--secondary)' }}>Key Message:</strong>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink)', margin: 0 }}>{stakeholder.keyMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function KeyExecutivesTab({ stakeholders }: KeyExecutivesTabProps) {
  // Quadrant classification
  const supporterDMs = stakeholders.filter(s => s.role === 'champion' || (s.role === 'decision-maker' && s.relationshipStrength !== 'weak'))
  const detractorDMs = stakeholders.filter(s => s.role === 'blocker' || (s.role === 'decision-maker' && s.relationshipStrength === 'weak'))
  const supporterInfluencers = stakeholders.filter(s => s.role === 'influencer' && s.relationshipStrength !== 'weak')
  const detractorInfluencers = stakeholders.filter(s => s.role === 'influencer' && s.relationshipStrength === 'weak')

  // Sort: champions + decision-makers first for accordion
  const sortedForAccordion = [...stakeholders].sort((a, b) => {
    const order = { 'champion': 0, 'decision-maker': 1, 'influencer': 2, 'user': 3, 'blocker': 4 }
    return (order[a.role] ?? 5) - (order[b.role] ?? 5)
  })

  if (stakeholders.length === 0) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>No stakeholders mapped</div>
        <p style={{ fontSize: '0.875rem' }}>Add stakeholder data to the account plan JSON to see the executive map.</p>
      </div>
    )
  }

  const QuadrantBox = ({ title, items, borderColor, bgColor }: { title: string; items: Stakeholder[]; borderColor: string; bgColor: string }) => (
    <div style={{ border: `2px solid ${borderColor}`, padding: '1.5rem', minHeight: '160px', background: bgColor }}>
      <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${borderColor}`, color: 'var(--secondary)' }}>
        {title}
      </h4>
      {items.length > 0 ? items.map(s => (
        <div key={s.id} style={{ display: 'inline-block', background: 'white', border: '1px solid var(--border)', padding: '0.4rem 0.9rem', margin: '0.2rem', borderRadius: '3px', fontSize: '0.875rem' }}>
          <strong>{s.name}</strong>
          {s.title && <><br /><small style={{ color: 'var(--muted)' }}>{s.title}</small></>}
        </div>
      )) : (
        <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.875rem' }}>None identified</p>
      )}
    </div>
  )

  return (
    <div className="space-y-10">

      {/* Decision Maker & Influencer Matrix */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          Decision Maker & Influencer Analysis
        </h2>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <QuadrantBox title="✅ Supporter & Decision Maker" items={supporterDMs} borderColor="var(--success, #4caf50)" bgColor="rgba(76,175,80,0.05)" />
            <QuadrantBox title="⚠️ Detractor & Decision Maker" items={detractorDMs} borderColor="var(--critical, #e53935)" bgColor="rgba(229,57,53,0.05)" />
            <QuadrantBox title="✅ Supporter & Influencer" items={supporterInfluencers} borderColor="#81c784" bgColor="rgba(76,175,80,0.02)" />
            <QuadrantBox title="⚠️ Detractor & Influencer" items={detractorInfluencers} borderColor="#ef5350" bgColor="rgba(229,57,53,0.02)" />
          </div>
        </div>
      </div>

      {/* Executive Deep Dive Accordions */}
      <div>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
          Executive Deep Dive
        </h3>
        {sortedForAccordion.map((s, i) => (
          <ExecutiveAccordion key={s.id} stakeholder={s} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Relationship Actions Table */}
      <div>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.25rem' }}>
          Relationship Actions — Next 30/60/90 Days
        </h3>
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                {['Name', 'Title / Role', 'Decision / Influence', 'Status', 'Next Action', 'Timeline'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedForAccordion.map((s, i) => {
                const isHighPri = s.role === 'champion' || s.role === 'decision-maker' || s.role === 'blocker'
                const timeline = i === 0 ? 'Week 1' : i < 3 ? 'Days 1–30' : i < 5 ? 'Days 31–60' : 'Days 61–90'
                const timelineVariant = i === 0 ? 'critical' : i < 3 ? 'high' : 'medium'
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: isHighPri ? 'rgba(229,57,53,0.05)' : 'transparent' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--secondary)' }}>{s.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--muted)' }}>{s.title || '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--ink)' }}>{s.role.replace('-', ' ')}</td>
                    <td style={{ padding: '1rem' }}>
                      <Badge variant={{ strong: 'success', moderate: 'medium', weak: 'critical', unknown: 'neutral' }[s.relationshipStrength] as 'success' | 'medium' | 'critical' | 'neutral'}>
                        {s.relationshipStrength}
                      </Badge>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>
                      {s.notes?.slice(0, 80) || `Engage and build relationship`}
                    </td>
                    <td style={{ padding: '1rem' }}><Badge variant={timelineVariant as 'critical' | 'high' | 'medium'}>{timeline}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/accounts/[name]/_components/key-executives-tab.tsx
git commit -m "feat(tab): add KeyExecutivesTab with decision matrix, accordions, relationship table"
```

---

### Task 10: Create Org Structure tab

**Files:**
- Create: `src/app/accounts/[name]/_components/org-structure-tab.tsx`

- [ ] **Step 1: Create component**

```tsx
/**
 * OrgStructureTab - Visual org-node hierarchy with decision hierarchy numbered list
 * Server Component — pure display, no interactivity needed
 * Matches Telstra HTML org-chart section: bordered cards, CEO style, target/advocate variants
 */

import type { Stakeholder } from '@/lib/types/account-plan'

interface OrgStructureTabProps {
  stakeholders: Stakeholder[]
  customerName: string
  bu: string
}

function OrgNode({ stakeholder }: { stakeholder: Stakeholder }) {
  const isChampion = stakeholder.role === 'champion'
  const isDecisionMaker = stakeholder.role === 'decision-maker'
  const isBlocker = stakeholder.role === 'blocker'

  const borderColor = isChampion ? 'var(--success, #4caf50)' : isDecisionMaker ? 'var(--accent)' : isBlocker ? 'var(--critical, #e53935)' : 'var(--secondary)'
  const borderWidth = isChampion || isDecisionMaker ? '3px' : '2px'
  const bgColor = isChampion ? 'rgba(76,175,80,0.05)' : isDecisionMaker ? 'rgba(200,75,49,0.04)' : 'white'

  const badgeLabel = { champion: 'INTERNAL ADVOCATE', 'decision-maker': 'KEY TARGET', influencer: 'INFLUENCER', blocker: 'POTENTIAL RISK', user: 'END USER' }[stakeholder.role] ?? ''
  const badgeBg = { champion: 'var(--success, #4caf50)', 'decision-maker': 'var(--critical, #e53935)', influencer: 'var(--warning, #ff9800)', blocker: 'var(--critical, #e53935)', user: 'var(--muted)' }[stakeholder.role] ?? 'var(--muted)'

  return (
    <div style={{
      background: bgColor,
      border: `${borderWidth} solid ${borderColor}`,
      padding: '1.25rem',
      margin: '0.5rem',
      borderRadius: '3px',
      minWidth: '220px',
      maxWidth: '260px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1rem', marginBottom: '0.25rem' }}>
        {stakeholder.title || stakeholder.role}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
        {stakeholder.name}
        {isChampion && ' ✅'}
        {isDecisionMaker && ' ⭐'}
      </div>
      <span style={{
        display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '2px',
        fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        background: badgeBg, color: 'white',
      }}>
        {badgeLabel}
      </span>
      {stakeholder.notes && (
        <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
          {stakeholder.notes.slice(0, 70)}{stakeholder.notes.length > 70 ? '…' : ''}
        </div>
      )}
    </div>
  )
}

export function OrgStructureTab({ stakeholders, customerName, bu }: OrgStructureTabProps) {
  if (stakeholders.length === 0) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>No org structure data</div>
        <p style={{ fontSize: '0.875rem' }}>Add stakeholder data with role classifications to visualize the org hierarchy.</p>
      </div>
    )
  }

  // Build hierarchy using reportsTo field
  const roots = stakeholders.filter(s => !s.reportsTo)
  const getChildren = (parentId: string) => stakeholders.filter(s => s.reportsTo === parentId)

  // Fallback: if no hierarchy info, group by role
  const useRoleGrouping = roots.length === 0

  const decisionMakers = stakeholders.filter(s => s.role === 'decision-maker')
  const champions = stakeholders.filter(s => s.role === 'champion')
  const influencers = stakeholders.filter(s => s.role === 'influencer')
  const users = stakeholders.filter(s => s.role === 'user')
  const blockers = stakeholders.filter(s => s.role === 'blocker')

  return (
    <div className="space-y-8">
      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)' }}>
        {customerName} Organizational Structure
      </h2>
      <p style={{ fontSize: '1rem', color: 'var(--muted)', marginTop: '-1rem' }}>
        Decision-making hierarchy for {bu} platform systems. Green borders indicate primary engagement targets.
      </p>

      {/* Org chart */}
      <div style={{ padding: '2rem', background: 'var(--paper)', border: '1px solid var(--border)' }}>
        {useRoleGrouping ? (
          // Role-based grouping when no hierarchy data
          <>
            {decisionMakers.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Decision Makers</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {decisionMakers.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
            {champions.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Champions & Advocates</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {champions.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
            {influencers.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Influencers</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {influencers.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
            {(users.length > 0 || blockers.length > 0) && (
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center' }}>Operational / Other</div>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[...users, ...blockers].map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              </div>
            )}
          </>
        ) : (
          // Tree-based hierarchy from reportsTo
          <>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                {roots.map(s => <OrgNode key={s.id} stakeholder={s} />)}
              </div>
            </div>
            {roots.map(root => {
              const children = getChildren(root.id)
              if (children.length === 0) return null
              return (
                <div key={root.id} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  {children.map(s => <OrgNode key={s.id} stakeholder={s} />)}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Decision Hierarchy */}
      <div style={{ padding: '1.5rem 2rem', background: 'rgba(200,75,49,0.05)', borderLeft: '4px solid var(--accent)' }}>
        <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>
          Decision Hierarchy for Platform Systems:
        </h4>
        <ol style={{ marginLeft: '1.5rem', lineHeight: 2, fontSize: '0.875rem', color: 'var(--ink)' }}>
          <li><strong>Level 1 — Strategic Direction:</strong> Decision Makers (business needs, strategic sponsorship)</li>
          <li><strong>Level 2 — Technical/Architectural:</strong> IT Function, platform teams, technical champions</li>
          <li><strong>Level 3 — Procurement & Budget:</strong> CFO/Finance, Chief Procurement Officer</li>
          <li><strong>Level 4 — Implementation & Ops:</strong> Internal advocates, business analysts, end users</li>
        </ol>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/org-structure-tab.tsx
git commit -m "feat(tab): add OrgStructureTab with visual org-node hierarchy and decision hierarchy"
```

---

## Chunk 5: Pain Points Tab + Competitive Tab

### Task 11: Create Pain Points tab

**Files:**
- Create: `src/app/accounts/[name]/_components/pain-points-tab.tsx`

- [ ] **Step 1: Create component**

```tsx
/**
 * PainPointsTab - 6-column pain points table + strategic initiatives cards
 * Server Component
 * Matches Telstra HTML pain-points section
 */

import type { PainPoint, Opportunity } from '@/lib/types/account-plan'

interface PainPointsTabProps {
  painPoints: PainPoint[]
  opportunities: Opportunity[]
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: '#8b8b8b', color: 'white' },
  }
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px',
      fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      ...styles[variant],
    }}>
      {children}
    </span>
  )
}

export function PainPointsTab({ painPoints, opportunities }: PainPointsTabProps) {
  return (
    <div className="space-y-10">

      {/* Pain Points Table */}
      {painPoints.length > 0 && (
        <div>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
            Customer Pain Points & Platform Alignment
          </h2>
          <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  {['Identified Pain', 'Customer Owner', 'Urgency', 'Budget?', 'Platform Solution', 'Next Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {painPoints.map((pp, i) => {
                  const isHigh = pp.severity === 'high'
                  const urgencyVariant = pp.severity === 'high' ? 'critical' : pp.severity === 'medium' ? 'high' : 'medium'
                  return (
                    <tr key={pp.id ?? i} style={{ borderBottom: '1px solid var(--border)', background: isHigh ? 'rgba(229,57,53,0.06)' : 'transparent' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong style={{ color: 'var(--secondary)', display: 'block', marginBottom: '0.2rem' }}>{pp.title}</strong>
                        {pp.description && <small style={{ color: 'var(--muted)' }}>{pp.description.slice(0, 80)}{pp.description.length > 80 ? '…' : ''}</small>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>{pp.owner || '—'}</td>
                      <td style={{ padding: '1rem' }}><Badge variant={urgencyVariant as 'critical' | 'high' | 'medium'}>{pp.severity?.toUpperCase()}</Badge></td>
                      <td style={{ padding: '1rem' }}>
                        {pp.status === 'active'
                          ? <Badge variant="critical">Active</Badge>
                          : pp.status === 'monitoring'
                            ? <Badge variant="medium">TBD</Badge>
                            : <Badge variant="success">Resolved</Badge>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {pp.cloudSenseSolution || 'Platform capabilities address this pain point'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {pp.nextAction
                          ? <><Badge variant={isHigh ? 'critical' : 'high'}>Q1&apos;26</Badge><div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{pp.nextAction}</div></>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategic Initiatives — opportunities as cards */}
      {opportunities.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            Strategic Initiatives & Opportunities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {opportunities.map((opp, i) => {
              const relevanceBadge = opp.probability && opp.probability > 70 ? { label: 'HIGH Relevance', variant: 'critical' } : opp.probability && opp.probability > 40 ? { label: 'MEDIUM Relevance', variant: 'high' } : { label: 'EXPLORING', variant: 'neutral' }
              return (
                <div key={opp.id ?? i} style={{ background: 'white', border: '1px solid var(--border)', padding: '2rem', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem' }}>{opp.title}</h3>
                  {opp.estimatedValue && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                      <strong>Value: </strong>${(opp.estimatedValue / 1000).toFixed(0)}K potential
                      {opp.probability != null && <span> · {opp.probability}% probability</span>}
                    </p>
                  )}
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {opp.description}
                  </p>
                  <Badge variant={relevanceBadge.variant as 'critical' | 'high' | 'neutral'}>{relevanceBadge.label}</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {painPoints.length === 0 && opportunities.length === 0 && (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>No pain points mapped</div>
          <p style={{ fontSize: '0.875rem' }}>Pain points and opportunities will appear as account data is enriched.</p>
        </div>
      )}

    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/pain-points-tab.tsx
git commit -m "feat(tab): add PainPointsTab with 6-col table and strategic initiatives cards"
```

---

### Task 12: Rebuild Competitive tab

**Files:**
- Modify: `src/app/accounts/[name]/_components/competitive-tab.tsx`

- [ ] **Step 1: Rewrite competitive-tab.tsx**

```tsx
/**
 * CompetitiveTab - Full Telstra-style rebuild
 * Threat table + advantages metrics grid + defensive strategy + risk timeline
 * Server Component
 */

import type { Competitor } from '@/lib/types/account-plan'

interface CompetitiveTabProps {
  competitors: Competitor[]
}

function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: '#8b8b8b', color: 'white' },
  }
  return (
    <span style={{ display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', ...styles[variant] }}>
      {children}
    </span>
  )
}

const STATIC_ADVANTAGES = [
  { label: 'Salesforce-Native', value: 'Built on Salesforce', description: 'Seamless with existing SF ecosystem, deep CRM integration, no middleware.' },
  { label: 'Telecom-Specific', value: 'Purpose-Built', description: 'Complex telecom bundles handled natively — not generic enterprise CPQ.' },
  { label: 'TM Forum Compliant', value: 'Open APIs', description: 'Aligns with autonomous network, composable architecture, open standards.' },
  { label: 'Full Quote-to-Cash', value: 'CPQ + Order Mgmt', description: 'End-to-end vs. CPQ-only competitors. Fewer integration points.' },
  { label: 'AI Roadmap', value: 'AI-Powered', description: 'AI-powered recommendations, predictive insights, intelligent automation.' },
  { label: 'Proven Track Record', value: '94% Retention', description: 'Industry-leading annual renewal rate reflecting consistent value delivery.' },
]

export function CompetitiveTab({ competitors }: CompetitiveTabProps) {
  const getThreatVariant = (c: Competitor): 'critical' | 'high' | 'medium' | 'neutral' => {
    if (c.threatLevel === 'critical') return 'critical'
    if (c.threatLevel === 'high' || c.type === 'both') return 'high'
    if (c.threatLevel === 'medium' || c.type === 'our-competitor') return 'medium'
    return 'neutral'
  }

  return (
    <div className="space-y-10">

      {/* Competitive Threats Table */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          Competitive Landscape Analysis
        </h2>
        {competitors.length > 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  {['Competitor', 'Threat Level', 'Customer Sponsor', 'Differentiators', 'Weaknesses', 'Next Action'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((comp, i) => {
                  const threatVariant = getThreatVariant(comp)
                  const isHighThreat = threatVariant === 'critical' || threatVariant === 'high'
                  return (
                    <tr key={comp.id ?? i} style={{ borderBottom: '1px solid var(--border)', background: isHighThreat ? 'rgba(255,152,0,0.06)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--secondary)' }}>{comp.name}</td>
                      <td style={{ padding: '1rem' }}><Badge variant={threatVariant}>{comp.threatLevel ?? (comp.type === 'both' ? 'HIGH' : comp.type === 'our-competitor' ? 'MEDIUM' : 'LOW')}</Badge></td>
                      <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>{comp.customerSponsor || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {comp.weaknesses.length > 0 ? comp.weaknesses.slice(0, 2).map((w, j) => <div key={j}>• {w}</div>) : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {comp.strengths.length > 0 ? comp.strengths.slice(0, 2).map((s, j) => <div key={j}>• {s}</div>) : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {comp.nextActionToDefend
                          ? <><Badge variant={isHighThreat ? 'high' : 'medium'}>Q1&apos;26</Badge><div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{comp.nextActionToDefend}</div></>
                          : <span style={{ color: 'var(--muted)' }}>Monitor</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'white', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            No competitive intelligence available yet.
          </div>
        )}
      </div>

      {/* Competitive Advantages Metrics Grid */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
          Our Competitive Advantages
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {STATIC_ADVANTAGES.map(({ label, value, description }) => (
            <div key={label} style={{ background: 'var(--highlight)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{label}</div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem' }}>{value}</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Defensive Strategy */}
      <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>
          Defensive Strategy & Competitive Positioning
        </h3>
        <ol style={{ marginLeft: '1.5rem', lineHeight: 2.2, fontSize: '0.9rem', color: 'var(--ink)' }}>
          <li><strong>Strengthen Platform Positioning:</strong> Emphasize native integration depth and telecom-specific capabilities that generic competitors cannot match.</li>
          <li><strong>Demonstrate Business Alignment:</strong> Position platform as enabler of faster sales, simpler quotes, fewer errors — directly supporting customer cost reduction goals.</li>
          <li><strong>Present AI Roadmap:</strong> Highlight AI-powered capabilities and composable architecture alignment with customer technology direction.</li>
          <li><strong>Expand Footprint Before Review Cycles:</strong> Drive adoption and usage before any competitive evaluation, creating switching costs beyond technology.</li>
          <li><strong>Build Multi-Threaded Relationships:</strong> Executive relationships that survive contact turnover create strategic moats.</li>
        </ol>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/competitive-tab.tsx
git commit -m "feat(competitive): rebuild with threat table, advantages grid, defensive strategy"
```

---

## Chunk 6: Action Plan Tab

### Task 13: Create Action Plan tab with visual timeline

**Files:**
- Create: `src/app/accounts/[name]/_components/action-plan-tab.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client'

/**
 * ActionPlanTab - Visual zigzag timeline + detailed actions table + key messages + escalation
 * Client Component — uses useState for status toggle interactivity
 * Matches Telstra HTML action-plan section exactly
 */

import { useState } from 'react'
import type { ActionItem, Stakeholder } from '@/lib/types/account-plan'

interface ActionPlanTabProps {
  actions: ActionItem[]
  stakeholders?: Stakeholder[]
}

function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'critical' | 'high' | 'medium' | 'success' | 'neutral' }) {
  const styles = {
    critical: { background: '#e53935', color: 'white' },
    high: { background: '#ff9800', color: 'white' },
    medium: { background: '#ffc107', color: '#1a1a1a' },
    success: { background: '#4caf50', color: 'white' },
    neutral: { background: '#8b8b8b', color: 'white' },
  }
  return (
    <span style={{ display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', ...styles[variant] }}>
      {children}
    </span>
  )
}

const TIMELINE_PHASES = [
  {
    date: 'Days 1–30: IMMEDIATE ACTIONS',
    items: ['Map all current stakeholders and validate org structure', 'Re-engage existing champions and advocates immediately', 'Identify any champion departures or relationship gaps', 'Prepare executive briefing deck documenting current deployment value'],
  },
  {
    date: 'Days 31–60: RELATIONSHIP BUILDING',
    items: ['Executive briefing with primary decision makers (business reset alignment)', 'Technical roadmap presentation to IT/Product & Tech team', 'Renewal proposals to any upcoming contract renewals', 'ROI analysis document for CFO/Finance stakeholders'],
  },
  {
    date: 'Days 61–90: EXECUTION & EXPANSION',
    items: ['Annual Business Review with all stakeholders', 'Formal renewal negotiation with multi-year proposal', 'Main contract expansion proposal (upsell formalization)', 'Identify adjacent team or entity expansion opportunities'],
  },
  {
    date: 'Q3 ONWARDS: CRITICAL MILESTONES',
    items: ['Execute on expansion opportunities identified in 90-day plan', 'Quarterly Business Reviews on cadence', 'Review and refresh account plan based on outcomes'],
    isCritical: true,
  },
]

export function ActionPlanTab({ actions, stakeholders = [] }: ActionPlanTabProps) {
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionItem['status']>>(
    Object.fromEntries(actions.map(a => [a.id, a.status]))
  )

  const toggleStatus = (id: string) => {
    setActionStatuses(prev => ({
      ...prev,
      [id]: prev[id] === 'done' ? 'todo' : prev[id] === 'todo' ? 'in-progress' : 'done',
    }))
  }

  const priorityVariant = (p: string) => p === 'high' ? 'critical' : p === 'medium' ? 'high' : 'medium'
  const statusVariant = (s: string) => s === 'done' ? 'success' : s === 'in-progress' ? 'high' : 'neutral'

  // Champions for key messages
  const champions = stakeholders.filter(s => s.role === 'champion' || s.role === 'decision-maker').slice(0, 4)

  return (
    <div className="space-y-12">

      {/* Visual Zigzag Timeline */}
      <div>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          30/60/90 Day Action Plan
        </h2>

        {/* Timeline */}
        <div style={{ position: 'relative', padding: '2rem 0', marginTop: '2rem' }}>
          {/* Center line */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'var(--border)', transform: 'translateX(-50%)' }} />

          {TIMELINE_PHASES.map((phase, i) => {
            const isOdd = i % 2 === 0
            return (
              <div key={i} style={{
                position: 'relative',
                marginBottom: '3rem',
                paddingLeft: isOdd ? '2rem' : 'calc(50% + 2rem)',
                paddingRight: isOdd ? 'calc(50% + 2rem)' : '2rem',
                textAlign: isOdd ? 'right' : 'left',
              }}>
                {/* Center dot */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '1rem',
                  width: '20px',
                  height: '20px',
                  background: phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)',
                  border: '4px solid white',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 0 4px var(--border)',
                  zIndex: 1,
                }} />

                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  borderLeft: isOdd ? 'none' : `3px solid ${phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)'}`,
                  borderRight: isOdd ? `3px solid ${phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)'}` : 'none',
                }}>
                  <div style={{
                    fontWeight: 700,
                    color: phase.isCritical ? 'var(--critical, #e53935)' : 'var(--accent)',
                    fontSize: '1rem',
                    marginBottom: '0.75rem',
                    fontFamily: '"Cormorant Garamond", serif',
                    letterSpacing: '0.01em',
                  }}>
                    {phase.date}
                  </div>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: isOdd ? 0 : '1.25rem', paddingRight: isOdd ? '1.25rem' : 0, listStyle: isOdd ? 'none' : 'disc', fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--ink)' }}>
                    {phase.items.map((item, j) => (
                      <li key={j} style={{ marginBottom: '0.2rem' }}>
                        {isOdd ? `${item} •` : `• ${item}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Action Items Table */}
      {actions.length > 0 && (
        <div>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.25rem' }}>
            Detailed Action Items with Owners & Status
          </h3>
          <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  {['Action', 'Owner', 'Target / Outcome', 'Timeline', 'Priority', 'Status'].map(h => (
                    <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map(action => {
                  const currentStatus = actionStatuses[action.id] ?? action.status
                  const isHighPri = action.priority === 'high'
                  return (
                    <tr key={action.id} style={{ borderBottom: '1px solid var(--border)', background: isHighPri ? 'rgba(229,57,53,0.05)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--secondary)' }}>{action.title}</td>
                      <td style={{ padding: '1rem', color: 'var(--ink)', fontSize: '0.8rem' }}>{action.owner || '—'}</td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {action.description?.slice(0, 80) || '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.8rem' }}>{action.dueDate || '—'}</td>
                      <td style={{ padding: '1rem' }}><Badge variant={priorityVariant(action.priority) as 'critical' | 'high' | 'medium'}>{action.priority}</Badge></td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => toggleStatus(action.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Click to cycle status"
                        >
                          <Badge variant={statusVariant(currentStatus) as 'success' | 'high' | 'neutral'}>{currentStatus.replace('-', ' ')}</Badge>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Messages by Stakeholder */}
      {champions.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
          <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            Key Messages by Stakeholder
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            {champions.map(s => (
              <div key={s.id} style={{ padding: '1.5rem', background: 'var(--highlight)', borderLeft: '3px solid var(--accent)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                  To {s.name} ({s.title || s.role})
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  {s.keyMessage || `"Our platform delivers measurable value through faster operations, reduced errors, and improved productivity. We're committed to being a strategic partner in your success."`}
                </p>
              </div>
            ))}
            {/* Fill empty slots with generic messages */}
            {champions.length < 2 && (
              <div style={{ padding: '1.5rem', background: 'var(--highlight)', borderLeft: '3px solid var(--accent)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--secondary)', fontSize: '0.9rem' }}>To the Executive Team</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  "Our platform supports cost optimization while enabling growth through automation, reduced cycle times, and improved operational efficiency at scale."
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Escalation Triggers */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderLeft: '4px solid var(--critical, #e53935)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '2rem' }}>
        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem' }}>
          ⚠️ Escalation Triggers to Skyvera Leadership
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>Escalate immediately if any of the following occur:</p>
        <ul style={{ marginLeft: '1.5rem', lineHeight: 2.2, fontSize: '0.9rem', color: 'var(--ink)' }}>
          <li>Executive meeting request denied or ignored after 60 days</li>
          <li>Competitive RFP announced for platform or equivalent systems</li>
          <li>Upcoming renewal discussions stall or turn negative</li>
          <li>Budget cuts threaten existing contract value</li>
          <li>Contact turnover exceeds 50% of known advocates</li>
          <li>Platform satisfaction score drops materially in QBR feedback</li>
        </ul>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/accounts/[name]/_components/action-plan-tab.tsx
git commit -m "feat(tab): add ActionPlanTab with visual zigzag timeline, action table, key messages"
```

---

## Chunk 7: Cleanup + Build Verification

### Task 14: Clean up old tab files

**Files:**
- Delete: `src/app/accounts/[name]/_components/strategy-tab.tsx`
- Delete: `src/app/accounts/[name]/_components/organization-tab.tsx`
- Delete: `src/app/accounts/[name]/_components/action-items-tab.tsx`
- Delete: `src/app/accounts/[name]/_components/kanban-column.tsx`
- Delete: `src/app/accounts/[name]/_components/action-card.tsx`
- Delete: `src/app/accounts/[name]/_components/quick-add-action.tsx`
- Delete: `src/app/accounts/[name]/_components/stakeholder-card.tsx`
- Delete: `src/app/accounts/[name]/_components/retention-tab.tsx`

- [ ] **Step 1: Remove old files**
```bash
cd /Users/RAZER/Documents/projects/Skyvera
rm src/app/accounts/[name]/_components/strategy-tab.tsx
rm src/app/accounts/[name]/_components/organization-tab.tsx
rm src/app/accounts/[name]/_components/action-items-tab.tsx
rm src/app/accounts/[name]/_components/kanban-column.tsx
rm src/app/accounts/[name]/_components/action-card.tsx
rm src/app/accounts/[name]/_components/quick-add-action.tsx
rm -f src/app/accounts/[name]/_components/stakeholder-card.tsx
rm -f src/app/accounts/[name]/_components/retention-tab.tsx
```

- [ ] **Step 2: Full TypeScript check**
```bash
npx tsc --noEmit 2>&1
```
Expected: 0 errors

- [ ] **Step 3: Build check**
```bash
npm run build 2>&1 | tail -30
```
Expected: successful build, no type errors

- [ ] **Step 4: Commit cleanup**
```bash
git add -A
git commit -m "chore: remove replaced tab components (strategy, organization, action-items, kanban)"
```

---

### Task 15: Fix the nav default tab and verify end-to-end

- [ ] **Step 1: Verify the default tab still works**

In `page.tsx` the default is `tab || 'overview'` — this is correct, no change needed.

- [ ] **Step 2: Check for any remaining references to old tab IDs**
```bash
grep -r "strategy\|action-items\|organization" src/app/accounts/ --include="*.tsx" | grep -v "node_modules"
```
Expected: no references to old tab IDs in routing code

- [ ] **Step 3: Final build**
```bash
npm run build 2>&1 | grep -E "error|Error|warning" | head -20
```
Expected: clean build

- [ ] **Step 4: Deploy**
```bash
git push origin fix/pr-review-hardening
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-10-account-plan-overhaul.md`.**
