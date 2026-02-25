# Account Plan Redesign — Full Telstra Rebuild

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild all 8 account plan tab components to faithfully match `Telstra_Account_Plan_Interactive.html` pixel-level patterns.

**Architecture:** All components are Server Components except `tab-navigation.tsx` (client) and `action-items-tab.tsx` (has client sub-component for @dnd-kit). Design tokens from `globals.css` used throughout. No new dependencies.

**Tech Stack:** Next.js 15+, Tailwind CSS v4, CSS custom properties, lucide-react, @dnd-kit (preserved)

**Critical Fix Everywhere:** `border-l-3` / `border-b-3` are INVALID Tailwind v4 classes — silently fail. Replace with `border-l-[3px]` or `style={{ borderLeftWidth: '3px' }}`.

---

## Telstra Pattern Reference (use in every component)

```tsx
// metric-box — bg-highlight, border-left-3 accent, Cormorant value
<div className="bg-[var(--highlight)] rounded-lg p-6 border-l-[3px] border-l-[var(--accent)]">
  <div className="font-display text-3xl font-bold text-[var(--secondary)]">{value}</div>
  <div className="text-xs text-[var(--muted)] uppercase tracking-widest mt-1">{label}</div>
</div>

// data-table — dark thead bg-secondary, white, uppercase, tracking-widest
<table className="w-full border-collapse text-sm">
  <thead>
    <tr className="bg-[var(--secondary)] text-white">
      <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Col</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors">
      <td className="p-4 text-[var(--ink)]">Value</td>
    </tr>
  </tbody>
</table>

// card — white, border, hover lift + gradient top sweep
<div className="bg-white rounded-xl border border-[var(--border)] p-6
                hover:-translate-y-0.5 hover:shadow-lg transition-all
                relative overflow-hidden group">
  <div className="absolute top-0 left-0 right-0 h-1
                  bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)]
                  opacity-0 group-hover:opacity-100 transition-opacity" />
  {/* content */}
</div>

// badge — 2px radius, uppercase, letter-spacing
<span className="inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide bg-[var(--accent)] text-white">
  ACTIVE
</span>

// alert-banner — gradient critical, border-left, shadow
<div className="bg-gradient-to-r from-[var(--critical)] to-[#d4594a]
                text-white rounded-lg p-5
                border-l-[5px] border-l-white/30
                shadow-lg mb-6">
  {content}
</div>
```

---

## Task 1: tab-navigation.tsx

**File:** `src/app/accounts/[name]/_components/tab-navigation.tsx`

**Step 1: Replace the component entirely**

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'financials', label: '💰 Financials' },
  { id: 'strategy', label: '🎯 Strategy' },
  { id: 'competitive', label: '⚔️ Competitive' },
  { id: 'organization', label: '🏢 Organization' },
  { id: 'intelligence', label: '🧠 Intelligence' },
  { id: 'action-items', label: '✅ Action Items' },
]

export function TabNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  return (
    <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => router.push(`?tab=${id}`, { scroll: false })}
              className={`
                flex-shrink-0 px-6 py-4 text-sm font-semibold whitespace-nowrap
                border-b-[3px] transition-all
                ${isActive
                  ? 'border-b-[var(--accent)] text-[var(--accent)] bg-[var(--highlight)]'
                  : 'border-b-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--highlight)]/50'
                }
              `}
            >
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/tab-navigation.tsx
git commit -m "fix(account-plan): rebuild tab-navigation — fix invalid border-b-3, Telstra tab style"
```

---

## Task 2: overview-tab.tsx

**File:** `src/app/accounts/[name]/_components/overview-tab.tsx`

**Step 1: Rebuild the component**

```tsx
import type { AccountPlan } from '@/lib/types/account-plan'
import { AlertTriangle, TrendingUp, TrendingDown, Shield } from 'lucide-react'

interface OverviewTabProps {
  plan: AccountPlan
}

export function OverviewTab({ plan }: OverviewTabProps) {
  const { account, financials, actionItems, risks, opportunities } = plan

  // Top 3 urgent action items
  const criticalActions = actionItems
    .filter((a) => a.priority === 'critical' || a.priority === 'high')
    .slice(0, 3)

  const hasAlert = risks.some((r) => r.level === 'critical' || r.level === 'high')

  return (
    <div className="space-y-8">
      {/* Alert Banner */}
      {hasAlert && (
        <div
          className="text-white rounded-lg p-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--critical), #d4594a)',
            borderLeft: '5px solid rgba(255,255,255,0.3)',
          }}
        >
          <div className="flex items-center gap-3 font-bold text-lg mb-2">
            <AlertTriangle size={20} />
            ACCOUNT RISK ALERT
          </div>
          <div className="text-white/90 text-sm leading-relaxed">
            {risks.find((r) => r.level === 'critical' || r.level === 'high')?.description ||
              'This account has active high-priority risks requiring immediate attention.'}
          </div>
        </div>
      )}

      {/* 90-Day Priority Metric Boxes */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          90-Day Priorities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {criticalActions.map((action, i) => (
            <div
              key={action.id}
              className="bg-[var(--highlight)] rounded-lg p-6"
              style={{ borderLeft: '3px solid var(--accent)' }}
            >
              <div className="font-display text-3xl font-bold text-[var(--secondary)] mb-1">
                {i + 1 === 1 ? '30' : i + 1 === 2 ? '60' : '90'}
                <span className="text-base font-sans font-normal text-[var(--muted)] ml-1">day</span>
              </div>
              <div className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2">
                {action.priority} priority
              </div>
              <div className="text-sm text-[var(--ink)] font-medium leading-snug">
                {action.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Account Status + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Status */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <h3 className="font-display text-xl font-semibold text-[var(--secondary)] mb-4">
            Account Status
          </h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {[
                { label: 'Account', value: account.name },
                { label: 'Industry', value: account.industry || '—' },
                { label: 'Region', value: account.region || '—' },
                {
                  label: 'ARR',
                  value: financials?.arr
                    ? `$${(financials.arr / 1e6).toFixed(2)}M`
                    : '—',
                },
                {
                  label: 'Health Score',
                  value: account.healthScore ? `${account.healthScore}/100` : '—',
                },
                { label: 'Relationship', value: account.relationshipStatus || '—' },
              ].map(({ label, value }) => (
                <tr key={label} className="border-b border-[var(--border)]">
                  <td className="py-3 pr-4 text-xs uppercase tracking-widest text-[var(--muted)] font-semibold w-36">
                    {label}
                  </td>
                  <td className="py-3 text-[var(--ink)] font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue KPIs */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6">
          <h3 className="font-display text-xl font-semibold text-[var(--secondary)] mb-4">
            Revenue Overview
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: 'ARR',
                value: financials?.arr ? `$${(financials.arr / 1e6).toFixed(2)}M` : '—',
                icon: <TrendingUp size={16} className="text-[var(--success)]" />,
              },
              {
                label: 'Renewal Date',
                value: financials?.renewalDate || '—',
                icon: <Shield size={16} className="text-[var(--accent)]" />,
              },
              {
                label: 'Growth',
                value: financials?.growth ? `${financials.growth > 0 ? '+' : ''}${financials.growth}%` : '—',
                icon:
                  (financials?.growth ?? 0) >= 0 ? (
                    <TrendingUp size={16} className="text-[var(--success)]" />
                  ) : (
                    <TrendingDown size={16} className="text-[var(--critical)]" />
                  ),
              },
              {
                label: 'Products',
                value: financials?.productCount ? `${financials.productCount}` : '—',
                icon: null,
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="bg-[var(--highlight)] rounded-lg p-4"
                style={{ borderLeft: '3px solid var(--accent)' }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {icon}
                  <span className="text-xs text-[var(--muted)] uppercase tracking-widest">
                    {label}
                  </span>
                </div>
                <div className="font-display text-xl font-bold text-[var(--secondary)]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks Table */}
      {risks.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Risk Register
          </h2>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Risk</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Level</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((risk, i) => (
                  <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors">
                    <td className="p-4 text-[var(--ink)]">{risk.description}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                          risk.level === 'critical'
                            ? 'bg-[var(--critical)]'
                            : risk.level === 'high'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--success)]'
                        }`}
                      >
                        {risk.level}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted)] text-sm">{risk.mitigation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunities Table */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Expansion Opportunities
          </h2>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Opportunity</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Value</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp, i) => (
                  <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors">
                    <td className="p-4 text-[var(--ink)] font-medium">{opp.title}</td>
                    <td className="p-4 text-[var(--ink)]">
                      {opp.value ? `$${(opp.value / 1e3).toFixed(0)}K` : '—'}
                    </td>
                    <td className="p-4 text-[var(--muted)]">{opp.timeline || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/overview-tab.tsx
git commit -m "fix(account-plan): rebuild overview-tab — Telstra alert, metric-boxes, data-tables"
```

---

## Task 3: financials-tab.tsx

**File:** `src/app/accounts/[name]/_components/financials-tab.tsx`

**Step 1: Fix all `border-l-3` → `border-l-[3px]` and apply Telstra dark thead**

The existing financials-tab is structurally correct (dark thead, KPI cards) but has invalid `border-l-3` classes. Full rebuild:

```tsx
import type { AccountPlan } from '@/lib/types/account-plan'
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'

interface FinancialsTabProps {
  plan: AccountPlan
}

export function FinancialsTab({ plan }: FinancialsTabProps) {
  const { financials, subscriptions, account } = plan

  return (
    <div className="space-y-8">
      {/* ARR Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'ARR',
            value: financials?.arr ? `$${(financials.arr / 1e6).toFixed(2)}M` : '—',
            sub: 'Annual Recurring Revenue',
          },
          {
            label: 'Growth',
            value: financials?.growth ? `${financials.growth > 0 ? '+' : ''}${financials.growth}%` : '—',
            sub: 'Year over Year',
          },
          {
            label: 'Renewal',
            value: financials?.renewalDate || '—',
            sub: 'Next renewal date',
          },
          {
            label: 'Products',
            value: financials?.productCount ? `${financials.productCount}` : '—',
            sub: 'Active subscriptions',
          },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="bg-[var(--highlight)] rounded-lg p-6"
            style={{ borderLeft: '3px solid var(--accent)' }}
          >
            <div className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1">{label}</div>
            <div className="font-display text-3xl font-bold text-[var(--secondary)] mb-1">{value}</div>
            <div className="text-xs text-[var(--muted)]">{sub}</div>
          </div>
        ))}
      </div>

      {/* Subscription Data Table */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          Subscription Details
        </h2>
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--secondary)] text-white">
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Product</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">ARR</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Start Date</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Renewal</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(subscriptions ?? []).length > 0 ? (
                subscriptions!.map((sub, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">{sub.product || sub.name}</td>
                    <td className="p-4 text-[var(--ink)]">
                      {sub.arr ? `$${(sub.arr / 1e3).toFixed(0)}K` : sub.value ? `$${(sub.value / 1e3).toFixed(0)}K` : '—'}
                    </td>
                    <td className="p-4 text-[var(--muted)]">{sub.startDate || '—'}</td>
                    <td className="p-4 text-[var(--muted)]">{sub.renewalDate || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                          sub.status === 'active'
                            ? 'bg-[var(--success)]'
                            : sub.status === 'at-risk'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--critical)]'
                        }`}
                      >
                        {sub.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--muted)]">
                    No subscription data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Timeline */}
      {financials?.renewalDate && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Renewal Timeline
          </h2>
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <div className="flex items-start gap-4">
              <div
                className="rounded-full p-3 flex-shrink-0"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div className="font-semibold text-[var(--secondary)] text-lg mb-1">
                  {financials.renewalDate}
                </div>
                <div className="text-sm text-[var(--muted)]">
                  Next renewal date for {account.name}. Ensure renewal discussion is initiated at least 90 days prior.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/financials-tab.tsx
git commit -m "fix(account-plan): rebuild financials-tab — Telstra dark thead, metric-boxes, valid borders"
```

---

## Task 4: strategy-tab.tsx

**File:** `src/app/accounts/[name]/_components/strategy-tab.tsx`

**Step 1: Full rebuild**

```tsx
import type { AccountPlan } from '@/lib/types/account-plan'
import { ChevronDown } from 'lucide-react'

interface StrategyTabProps {
  plan: AccountPlan
}

export function StrategyTab({ plan }: StrategyTabProps) {
  const { painPoints, opportunities, strategicObjectives } = plan

  return (
    <div className="space-y-8">
      {/* Strategic Objectives */}
      {(strategicObjectives ?? []).length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Strategic Objectives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategicObjectives!.map((obj, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[var(--border)] p-6 hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="font-display text-lg font-semibold text-[var(--secondary)] mb-2">
                  {obj.title}
                </div>
                <div className="text-sm text-[var(--muted)] leading-relaxed">{obj.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pain Points Table */}
      {(painPoints ?? []).length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Pain Points
          </h2>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Pain Point</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Impact</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Our Solution</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {painPoints!.map((pp, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">{pp.title}</td>
                    <td className="p-4 text-[var(--muted)] text-sm leading-relaxed">{pp.impact || pp.description}</td>
                    <td className="p-4 text-[var(--muted)] text-sm leading-relaxed">{pp.solution || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                          pp.priority === 'high' || pp.priority === 'critical'
                            ? 'bg-[var(--critical)]'
                            : pp.priority === 'medium'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--success)]'
                        }`}
                      >
                        {pp.priority || 'medium'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunities Table */}
      {(opportunities ?? []).length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Growth Opportunities
          </h2>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Opportunity</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Value</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Timeline</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Probability</th>
                </tr>
              </thead>
              <tbody>
                {opportunities!.map((opp, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 text-[var(--ink)] font-medium">{opp.title}</td>
                    <td className="p-4 text-[var(--ink)]">
                      {opp.value ? `$${(opp.value / 1e3).toFixed(0)}K` : '—'}
                    </td>
                    <td className="p-4 text-[var(--muted)]">{opp.timeline || '—'}</td>
                    <td className="p-4">
                      {opp.probability ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] rounded-full"
                              style={{ width: `${opp.probability}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--muted)] w-8">{opp.probability}%</span>
                        </div>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/strategy-tab.tsx
git commit -m "fix(account-plan): rebuild strategy-tab — Telstra tables, badges, hover cards"
```

---

## Task 5: competitive-tab.tsx

**File:** `src/app/accounts/[name]/_components/competitive-tab.tsx`

**Step 1: Full rebuild**

```tsx
import type { AccountPlan } from '@/lib/types/account-plan'
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react'

interface CompetitiveTabProps {
  plan: AccountPlan
}

export function CompetitiveTab({ plan }: CompetitiveTabProps) {
  const { competitors, competitiveAdvantages, competitivePosition } = plan

  return (
    <div className="space-y-8">
      {/* Competitive Position */}
      {competitivePosition && (
        <div
          className="text-white rounded-lg p-5 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--secondary), #1a2332)',
            borderLeft: '5px solid var(--accent)',
          }}
        >
          <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Competitive Position</div>
          <div className="text-2xl font-display font-bold mb-2">{competitivePosition.summary}</div>
          {competitivePosition.detail && (
            <div className="text-white/80 text-sm leading-relaxed">{competitivePosition.detail}</div>
          )}
        </div>
      )}

      {/* Our Advantages */}
      {(competitiveAdvantages ?? []).length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Our Advantages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitiveAdvantages!.map((adv, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[var(--border)] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[var(--success)] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--secondary)] mb-1">{adv.title}</div>
                    <div className="text-sm text-[var(--muted)]">{adv.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Landscape Table */}
      {(competitors ?? []).length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Competitive Landscape
          </h2>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--secondary)] text-white">
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Competitor</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Strengths</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Weaknesses</th>
                  <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Threat</th>
                </tr>
              </thead>
              <tbody>
                {competitors!.map((comp, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                  >
                    <td className="p-4 font-semibold text-[var(--secondary)]">{comp.name}</td>
                    <td className="p-4 text-[var(--muted)] text-sm">{comp.strengths || '—'}</td>
                    <td className="p-4 text-[var(--muted)] text-sm">{comp.weaknesses || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                          comp.threatLevel === 'high'
                            ? 'bg-[var(--critical)]'
                            : comp.threatLevel === 'medium'
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--success)]'
                        }`}
                      >
                        {comp.threatLevel || 'low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/competitive-tab.tsx
git commit -m "fix(account-plan): rebuild competitive-tab — Telstra table, advantage cards, position banner"
```

---

## Task 6: organization-tab.tsx

**File:** `src/app/accounts/[name]/_components/organization-tab.tsx`

**Step 1: Rebuild with decision matrix + org cards**

The current component is a Client Component (useState for expand/collapse). Preserve that.

```tsx
'use client'

import { useState } from 'react'
import type { AccountPlan } from '@/lib/types/account-plan'
import { ChevronDown, ChevronUp, Star } from 'lucide-react'
import type { Stakeholder } from '@/lib/types/account-plan'

interface OrganizationTabProps {
  plan: AccountPlan
}

export function OrganizationTab({ plan }: OrganizationTabProps) {
  const { stakeholders } = plan
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  // Classify into 4 quadrants: high/low influence × positive/negative sentiment
  const supporters = stakeholders.filter(
    (s) => (s.sentiment === 'positive' || s.sentiment === 'champion') && s.influence !== 'low'
  )
  const coaches = stakeholders.filter(
    (s) => (s.sentiment === 'positive' || s.sentiment === 'champion') && s.influence === 'low'
  )
  const blockers = stakeholders.filter(
    (s) => (s.sentiment === 'negative' || s.sentiment === 'detractor') && s.influence !== 'low'
  )
  const skeptics = stakeholders.filter(
    (s) => (s.sentiment === 'negative' || s.sentiment === 'detractor') && s.influence === 'low'
  )
  const neutral = stakeholders.filter(
    (s) => !s.sentiment || s.sentiment === 'neutral'
  )

  const StakeholderCard = ({ stakeholder }: { stakeholder: Stakeholder }) => {
    const isOpen = expanded.includes(stakeholder.id || stakeholder.name)
    return (
      <div
        className="bg-white rounded-lg border border-[var(--border)] p-3 mb-2 cursor-pointer hover:shadow-sm transition-all"
        style={
          stakeholder.role?.toLowerCase().includes('ceo') ||
          stakeholder.role?.toLowerCase().includes('cto') ||
          stakeholder.influence === 'executive'
            ? { borderLeft: '3px solid var(--accent)' }
            : {}
        }
        onClick={() => toggle(stakeholder.id || stakeholder.name)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-[var(--secondary)] text-sm">{stakeholder.name}</div>
            <div className="text-xs text-[var(--muted)]">{stakeholder.role || stakeholder.title}</div>
          </div>
          {isOpen ? (
            <ChevronUp size={14} className="text-[var(--muted)]" />
          ) : (
            <ChevronDown size={14} className="text-[var(--muted)]" />
          )}
        </div>
        {isOpen && stakeholder.notes && (
          <div className="mt-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--muted)] leading-relaxed">
            {stakeholder.notes}
          </div>
        )}
      </div>
    )
  }

  const Quadrant = ({
    title,
    items,
    accent,
    description,
  }: {
    title: string
    items: Stakeholder[]
    accent: string
    description: string
  }) => (
    <div
      className="bg-white rounded-xl border border-[var(--border)] p-5"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="font-display text-lg font-semibold text-[var(--secondary)] mb-1">{title}</div>
      <div className="text-xs text-[var(--muted)] mb-4">{description}</div>
      {items.length > 0 ? (
        items.map((s) => <StakeholderCard key={s.id || s.name} stakeholder={s} />)
      ) : (
        <div className="text-xs text-[var(--muted)] italic py-2">None identified</div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Decision Matrix — 4 quadrant */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-2 pb-2 border-b-[2px] border-[var(--border)]">
          Stakeholder Decision Matrix
        </h2>
        <p className="text-sm text-[var(--muted)] mb-6">
          Classify stakeholders by influence and sentiment to prioritize engagement strategy.
        </p>

        {/* Axis labels */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <Quadrant
              title="Champions"
              items={supporters}
              accent="var(--success)"
              description="High influence · Positive sentiment"
            />
            <Quadrant
              title="Blockers"
              items={blockers}
              accent="var(--critical)"
              description="High influence · Negative sentiment"
            />
            <Quadrant
              title="Coaches"
              items={coaches}
              accent="var(--accent)"
              description="Low influence · Positive sentiment"
            />
            <Quadrant
              title="Skeptics"
              items={skeptics}
              accent="var(--warning)"
              description="Low influence · Negative sentiment"
            />
          </div>
        </div>
      </div>

      {/* Neutral / Unclassified */}
      {neutral.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Neutral Stakeholders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {neutral.map((s) => (
              <StakeholderCard key={s.id || s.name} stakeholder={s} />
            ))}
          </div>
        </div>
      )}

      {/* Full Stakeholder Table */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
          All Stakeholders
        </h2>
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--secondary)] text-white">
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Name</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Role</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Influence</th>
                <th className="p-4 text-left text-xs uppercase tracking-widest font-semibold">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {stakeholders.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors"
                >
                  <td className="p-4 font-medium text-[var(--secondary)]">{s.name}</td>
                  <td className="p-4 text-[var(--muted)]">{s.role || s.title || '—'}</td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide bg-[var(--highlight)] text-[var(--secondary)]">
                      {s.influence || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                        s.sentiment === 'positive' || s.sentiment === 'champion'
                          ? 'bg-[var(--success)]'
                          : s.sentiment === 'negative' || s.sentiment === 'detractor'
                          ? 'bg-[var(--critical)]'
                          : 'bg-[var(--muted)]'
                      }`}
                    >
                      {s.sentiment || 'neutral'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/organization-tab.tsx
git commit -m "fix(account-plan): rebuild organization-tab — 4-quadrant decision matrix, org node cards"
```

---

## Task 7: intelligence-tab.tsx

**File:** `src/app/accounts/[name]/_components/intelligence-tab.tsx`

**Step 1: Rebuild with Telstra expandable sections**

This is a Server Component — no useState allowed. Use `<details>` + `<summary>` for native expandable.

```tsx
import type { AccountPlan } from '@/lib/types/account-plan'
import { ExternalLink, Radio } from 'lucide-react'

interface IntelligenceTabProps {
  plan: AccountPlan
}

export function IntelligenceTab({ plan }: IntelligenceTabProps) {
  const { intelligenceReport, newsItems } = plan

  if (!intelligenceReport && (!newsItems || newsItems.length === 0)) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <Radio size={40} className="mx-auto mb-4 opacity-30" />
        <div className="font-display text-2xl mb-2">No intelligence available</div>
        <div className="text-sm">Generate an account plan to populate intelligence data.</div>
      </div>
    )
  }

  const sections = intelligenceReport
    ? [
        { title: 'Executive Summary', content: intelligenceReport.executiveSummary },
        { title: 'Business Challenges', content: intelligenceReport.businessChallenges },
        { title: 'Technology Landscape', content: intelligenceReport.technologyLandscape },
        { title: 'Strategic Initiatives', content: intelligenceReport.strategicInitiatives },
        { title: 'Buying Signals', content: intelligenceReport.buyingSignals },
        { title: 'Relationship History', content: intelligenceReport.relationshipHistory },
        { title: 'Recommended Approach', content: intelligenceReport.recommendedApproach },
      ].filter((s) => s.content)
    : []

  return (
    <div className="space-y-8">
      {/* Expandable Sections */}
      {sections.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Intelligence Report
          </h2>
          <div className="space-y-3">
            {sections.map(({ title, content }) => (
              <details
                key={title}
                className="bg-white rounded-xl border border-[var(--border)] overflow-hidden group"
                open={title === 'Executive Summary'}
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--highlight)] transition-colors list-none">
                  <span className="font-semibold text-[var(--secondary)]">{title}</span>
                  <svg
                    className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--ink)] leading-relaxed border-t border-[var(--border)] pt-4">
                  {content}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* News & Signals */}
      {(newsItems ?? []).length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Recent News & Signals
          </h2>
          <div className="space-y-4">
            {newsItems!.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[var(--border)] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--secondary)] mb-1 leading-snug">
                      {item.title}
                    </div>
                    <div className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                      {item.summary}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      {item.date && <span>{item.date}</span>}
                      {item.source && (
                        <>
                          <span>·</span>
                          <span>{item.source}</span>
                        </>
                      )}
                      {item.relevance && (
                        <>
                          <span>·</span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-sm text-xs font-semibold uppercase tracking-wide text-white ${
                              item.relevance === 'high'
                                ? 'bg-[var(--accent)]'
                                : item.relevance === 'medium'
                                ? 'bg-[var(--warning)]'
                                : 'bg-[var(--muted)]'
                            }`}
                          >
                            {item.relevance}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/accounts/[name]/_components/intelligence-tab.tsx
git commit -m "fix(account-plan): rebuild intelligence-tab — Telstra expandable sections, news cards"
```

---

## Task 8: action-items-tab.tsx

**File:** `src/app/accounts/[name]/_components/action-items-tab.tsx`

**CRITICAL:** This file has a Client sub-component with @dnd-kit Kanban. Do NOT remove or modify the Kanban section. Only update the styling of the list view and 30/60/90 timeline.

**Step 1: Apply Telstra action-item styling to the list and timeline sections**

The action-items tab has two main sections:
1. A 30/60/90 timeline
2. A Kanban board (Client component with @dnd-kit — PRESERVE)

Read the file first to locate exactly which parts need styling changes. The Kanban section should be left untouched. Only update:
- The 30/60/90 timeline items to use `border-l-[4px] border-l-[var(--accent)]`
- Individual action item rows to use grid layout with `grid-cols-[1fr_auto]`
- Remove any invalid `border-l-3` / `border-l-4` with hardcoded colors

**Telstra action-item pattern:**
```tsx
<div
  className="bg-white rounded-lg p-5 mb-4 grid gap-2"
  style={{
    borderLeft: '4px solid var(--accent)',
    gridTemplateColumns: '1fr auto',
  }}
>
  <div>
    <div className="font-semibold text-[var(--secondary)] mb-1">{action.title}</div>
    <div className="text-sm text-[var(--muted)]">{action.description}</div>
  </div>
  <div className="flex flex-col items-end gap-2">
    <span className="inline-block px-3 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-white bg-[var(--accent)]">
      {action.priority}
    </span>
    <span className="text-xs text-[var(--muted)]">{action.owner}</span>
  </div>
</div>
```

**Telstra 30/60/90 timeline pattern:**
```tsx
<div className="relative pl-8 border-l-[2px] border-l-[var(--border)]">
  <div className="absolute left-[-5px] top-0 w-[10px] h-[10px] rounded-full bg-[var(--accent)] border-2 border-white" />
  {/* content */}
</div>
```

**Step 2: Read the file, apply targeted edits to non-Kanban sections**

(Agent should read the file first, identify the action item list and timeline JSX, and update only those sections using the Edit tool for targeted replacements.)

**Step 3: Commit**
```bash
git add src/app/accounts/[name]/_components/action-items-tab.tsx
git commit -m "fix(account-plan): action-items-tab — Telstra border-left-4, timeline, preserve Kanban"
```

---

## Task 9: Verify & Push

**Step 1: Run type check**
```bash
npx tsc --noEmit
```

Expected: 0 errors (or only pre-existing ones)

**Step 2: Build check**
```bash
npm run build 2>&1 | tail -20
```

Expected: successful build, no new errors

**Step 3: Push and deploy**
```bash
git push origin main
```

**Step 4: Verify on Vercel** — open account plan page, confirm:
- [ ] Tabs horizontal, sticky, active tab has accent bottom border
- [ ] Overview has alert banner (if risks present), metric boxes with left accent border
- [ ] All tables have dark `bg-[var(--secondary)]` thead
- [ ] Badges are `rounded-sm uppercase tracking-wide`
- [ ] Strategy/competitive tables render correctly
- [ ] Organization shows 4-quadrant decision matrix
- [ ] Intelligence shows expandable sections (native `<details>`)
- [ ] Action items show left-border-4 styling; Kanban still works
