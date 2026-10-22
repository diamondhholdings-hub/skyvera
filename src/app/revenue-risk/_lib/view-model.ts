/**
 * Revenue risk view model: filters the intelligence snapshot by business unit
 * and derives the KPI figures and tab tables. Pure functions over the
 * snapshot so the page stays a thin server component.
 */
import { join } from 'path'
import { readFileSync } from 'fs'
import {
  type IntelligenceSnapshot,
  type PipelineOpportunity,
  type Receivable,
  type Renewal,
  isAtRiskRenewal,
  normalizeCompanyName,
  quarterOrder,
} from '@/lib/data/server/intelligence-data'

export const TABS = [
  { id: 'renewals', label: 'Renewals' },
  { id: 'pipeline', label: 'Renewal pipeline' },
  { id: 'receivables', label: 'Receivables over 90 days' },
] as const

export type TabId = (typeof TABS)[number]['id']

export function parseTab(value: string | undefined): TabId {
  return TABS.some((t) => t.id === value) ? (value as TabId) : 'renewals'
}

export const CLOSED_LOST = 'Closed Lost'

/** Every business unit named in renewals, pipeline or receivables, A to Z. */
export function businessUnits(intel: IntelligenceSnapshot): string[] {
  const names = new Set<string>()
  for (const r of intel.renewals) if (r.bu) names.add(r.bu)
  for (const p of intel.pipeline) if (p.bu) names.add(p.bu)
  for (const r of intel.receivables) if (r.bu) names.add(r.bu)
  return [...names].sort((a, b) => a.localeCompare(b))
}

/** Canonical BU name for a ?bu= value (case-insensitive), or null for all. */
export function parseBU(value: string | undefined, options: string[]): string | null {
  if (!value) return null
  return options.find((o) => o.toLowerCase() === value.toLowerCase()) ?? null
}

export interface FilteredData {
  renewals: Renewal[]
  pipeline: PipelineOpportunity[]
  receivables: Receivable[]
}

export function filterByBU(intel: IntelligenceSnapshot, bu: string | null): FilteredData {
  if (!bu) return { renewals: intel.renewals, pipeline: intel.pipeline, receivables: intel.receivables }
  return {
    renewals: intel.renewals.filter((r) => r.bu === bu),
    pipeline: intel.pipeline.filter((p) => p.bu === bu),
    receivables: intel.receivables.filter((r) => r.bu === bu),
  }
}

/** The quarter label n quarters after "Q4'26"-style `quarter`. */
export function addQuarters(quarter: string, n: number): string | null {
  const m = quarter.match(/^Q([1-4])'(\d{2})$/)
  if (!m) return null
  const index = Number(m[2]) * 4 + (Number(m[1]) - 1) + n
  return `Q${(index % 4) + 1}'${String(Math.floor(index / 4)).padStart(2, '0')}`
}

export interface RiskKpis {
  currentQuarter: string | null
  renewingThisQuarter: { arr: number; count: number; atRiskArr: number }
  atRiskNext4: { arr: number; count: number; from: string | null; to: string | null }
  arOver90: { total: number; customers: number; largest: Receivable | null }
  openPipeline: { arr: number; count: number }
}

export function computeKpis(data: FilteredData, currentQuarter: string | null): RiskKpis {
  const thisQuarter = currentQuarter
    ? data.renewals.filter((r) => r.renewalQuarter === currentQuarter)
    : []

  const start = currentQuarter ? quarterOrder(currentQuarter) : Number.NaN
  const inWindow = (r: Renewal) => {
    if (!r.renewalQuarter || Number.isNaN(start)) return false
    const order = quarterOrder(r.renewalQuarter)
    return order >= start && order <= start + 3
  }
  const atRiskNext4 = data.renewals.filter((r) => inWindow(r) && isAtRiskRenewal(r))

  const withAr = data.receivables.filter((r) => r.arOver90 > 0)
  const largest = withAr.reduce<Receivable | null>((top, r) => (!top || r.arOver90 > top.arOver90 ? r : top), null)

  const open = data.pipeline.filter((p) => p.stage !== CLOSED_LOST)

  return {
    currentQuarter,
    renewingThisQuarter: {
      arr: sum(thisQuarter, (r) => r.arr),
      count: thisQuarter.length,
      atRiskArr: sum(thisQuarter.filter(isAtRiskRenewal), (r) => r.arr),
    },
    atRiskNext4: {
      arr: sum(atRiskNext4, (r) => r.arr),
      count: atRiskNext4.length,
      from: currentQuarter,
      to: currentQuarter ? addQuarters(currentQuarter, 3) : null,
    },
    arOver90: { total: sum(data.receivables, (r) => r.arOver90), customers: withAr.length, largest },
    openPipeline: { arr: sum(open, (p) => p.arr), count: open.length },
  }
}

export function sum<T>(rows: T[], value: (row: T) => number): number {
  return rows.reduce((total, row) => total + (value(row) || 0), 0)
}

// --------------------------------------------------------------------------
// Account links: only for names that exist in the budget snapshot
// --------------------------------------------------------------------------

let accountIndex: Map<string, string> | undefined

/**
 * Normalized name -> exact customer_name from src/data/skyvera-snapshot.json,
 * so links resolve on /accounts/[name] (which matches case-insensitively).
 */
function getAccountIndex(): Map<string, string> {
  if (accountIndex) return accountIndex
  const index = new Map<string, string>()
  try {
    const raw = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'skyvera-snapshot.json'), 'utf-8')) as {
      customers?: Record<string, Array<{ customer_name?: string }>>
    }
    for (const list of Object.values(raw.customers ?? {})) {
      for (const c of list) {
        if (c.customer_name) index.set(normalizeCompanyName(c.customer_name), c.customer_name)
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[revenue-risk] Failed to read customer snapshot:', error)
    }
  }
  accountIndex = index
  return index
}

/** Account page href for this name, or null when no such account exists. */
export function accountHref(name: string): string | null {
  const match = getAccountIndex().get(normalizeCompanyName(name))
  return match ? `/accounts/${encodeURIComponent(match)}` : null
}
