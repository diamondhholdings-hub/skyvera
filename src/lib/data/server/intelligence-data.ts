/**
 * Server-side access to src/data/intelligence-snapshot.json: renewals,
 * renewal pipeline, receivables, non-recurring revenue, vendors, central
 * functions, headcount (aggregated), AI cost, product P&Ls, cost benchmarks,
 * margin targets and the consolidated income statement history.
 *
 * Written by scripts/extract_intelligence.py (`npm run refresh-data`). Read
 * from disk like the other snapshots so it works on Vercel.
 */
import { join } from 'path'
import { readFileSync } from 'fs'

type ByQuarter = Record<string, number>

export interface Renewal {
  bu: string | null
  customer: string
  endUser: string | null
  subscriptionId: number
  start: string | null
  end: string | null
  arr: number
  renewalDate: string | null
  renewalQuarter: string | null
  willRenew: string | null
  upDownSellPct: number
  projectedArr: number
  arOver90: number
}

export interface PipelineOpportunity {
  opportunityId: string
  opportunity: string | null
  account: string
  bu: string | null
  productFamily: string | null
  stage: string | null
  type: string | null
  renewalDate: string | null
  closeDate: string | null
  owner: string | null
  probabilityPct: number
  currentArr: number
  arr: number
  totalPrice: number
  willRenew: string | null
}

export interface Receivable {
  customer: string
  bu: string | null
  arOver90: number
  arrInBudget: number
  arOver10PctOfArr: boolean
  revenueInBudget: boolean
  latestNote: string | null
  buComments: string | null
}

export interface NRRLine {
  customer: string
  class: string | null
  department: string | null
  nature: string | null
  trailing12Months: number
  byQuarter: ByQuarter
  notes: string | null
}

export interface VendorLine {
  vendor: string
  bu: string | null
  category: string | null
  nature: string | null
  department: string | null
  priorQuarterForecast: number
  priorQuarterBudget: number
  byQuarter: ByQuarter
  fourQuarterTotal: number
  comments: string | null
}

export interface CentralFunctionLine {
  category: string | null
  bu: string | null
  department: string | null
  service: string
  group: string | null
  cost: Record<string, number>
}

export interface HeadcountGroup {
  name: string
  headcount: number
  averageHeadcount: number
  cost: ByQuarter
}

export interface HeadcountData {
  quarters: string[]
  total: Omit<HeadcountGroup, 'name'>
  byDepartment: HeadcountGroup[]
  byLocation: HeadcountGroup[]
  byVertical: HeadcountGroup[]
  byCostType: HeadcountGroup[]
  byEmployment: HeadcountGroup[]
  adjustments: Array<{ description: string; vertical: string | null; cost: ByQuarter }>
  plannedTerminations: number
  summary: Record<string, {
    headcountEndOfQuarter: number
    averageHeadcount: number
    cost: number
    priorQuarterHeadcount: number
    priorQuarterCost: number
  }>
  teams: Array<{
    team: string
    category: string | null
    headcount: number
    cost: number
    priorQuarterHeadcount: number
    priorQuarterCost: number
  }>
}

export interface ProductPnL {
  product: string
  recurringRevenue: number
  nonRecurringRevenue: number
  totalRevenue: number
  totalHcCogs: number
  totalHcOpex: number
  nhcCogs: number
  nhcOpex: number
  cfCogs: number
  cfOpex: number
  writeOff: number
  coreAllocation: number
  totalExpenses: number
  netProfit: number
  netMarginPct: number
}

export interface IntelligenceSnapshot {
  source: string
  renewals: Renewal[]
  pipeline: PipelineOpportunity[]
  receivables: Receivable[]
  nrr: { quarters: string[]; lines: NRRLine[] }
  vendors: { quarters: string[]; priorQuarter: string; lines: VendorLine[] }
  centralFunctions: { periods: string[]; lines: CentralFunctionLine[] }
  headcount: HeadcountData
  aiCost: {
    current: string
    yearAgo: string
    metrics: Record<string, Record<string, number>>
    vendors: Array<Record<string, string | number>>
  }
  products: Record<string, ProductPnL[]>
  benchmark: {
    note: string
    summaryPct: Record<string, Record<string, number>>
    costPct: Record<string, Record<string, number>>
    varianceUsd: Record<string, Record<string, number>>
    rules: Array<{ rule: string; action: string | null }>
  }
  marginTargets: {
    quarter: string
    lines: Array<{ vertical: string; class: string | null; classType: string | null; revenue: number; targetMarginPct: number }>
  }
  history: { periods: string[]; lines: Record<string, Record<string, number>> }
}

let cached: IntelligenceSnapshot | null | undefined

/** The intelligence snapshot, or null when it hasn't been generated. */
export function getIntelligence(): IntelligenceSnapshot | null {
  if (cached !== undefined) return cached
  try {
    cached = JSON.parse(
      readFileSync(join(process.cwd(), 'src', 'data', 'intelligence-snapshot.json'), 'utf-8')
    ) as IntelligenceSnapshot
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[intelligence-data] Failed to read snapshot:', error)
    }
    cached = null
  }
  return cached
}

// --------------------------------------------------------------------------
// Customer name matching
// --------------------------------------------------------------------------

const LEGAL_SUFFIXES = new Set([
  'inc', 'incorporated', 'ltd', 'limited', 'llc', 'plc', 'pjsc', 'psc', 'corp', 'corporation',
  'co', 'company', 'sa', 'sas', 'spa', 'bv', 'nv', 'gmbh', 'ag', 'ab', 'as', 'oy', 'sdn', 'bhd',
  'pty', 'pt', 'tbk', 'the', 'srl', 'sro', 'kk',
])

/**
 * Comparable form of a company name: lower case, punctuation removed, legal
 * suffixes dropped. The workbook spells one customer differently across
 * sheets ("TELECOM ARGENTINA S.A." vs "Telecom Argentina SA").
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\./g, '') // "S.A." -> "sa", "Co." -> "co", so suffixes drop
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !LEGAL_SUFFIXES.has(word))
    .join(' ')
}

/** True when two names refer to the same company, or one contains the other. */
export function namesMatch(a: string, b: string): boolean {
  const x = normalizeCompanyName(a)
  const y = normalizeCompanyName(b)
  if (!x || !y) return false
  if (x === y) return true
  // Containment only for names long enough to be distinctive
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x]
  return shorter.length >= 5 && (` ${longer} `).includes(` ${shorter} `)
}

export interface CustomerIntelligence {
  renewals: Renewal[]
  pipeline: PipelineOpportunity[]
  receivable: Receivable | null
  nrr: NRRLine[]
}

/**
 * Rows naming this customer: exact (normalized) matches when there are any,
 * otherwise containment matches, so "Telstra Limited" doesn't also pick up
 * "Telstra International Limited".
 */
export function matchRows<T>(rows: T[], name: (row: T) => string, customerName: string): T[] {
  const target = normalizeCompanyName(customerName)
  const exact = rows.filter((row) => normalizeCompanyName(name(row)) === target)
  return exact.length ? exact : rows.filter((row) => namesMatch(name(row), customerName))
}

/** Everything the snapshot holds about one customer, matched by name. */
export function getCustomerIntelligence(customerName: string): CustomerIntelligence {
  const intel = getIntelligence()
  if (!intel) return { renewals: [], pipeline: [], receivable: null, nrr: [] }
  return {
    renewals: matchRows(intel.renewals, (r) => r.customer, customerName),
    pipeline: matchRows(intel.pipeline, (p) => p.account, customerName),
    receivable: matchRows(intel.receivables, (r) => r.customer, customerName)[0] ?? null,
    nrr: matchRows(intel.nrr.lines, (n) => n.customer, customerName),
  }
}

// --------------------------------------------------------------------------
// Summaries shared by pages, alerts and the query tools
// --------------------------------------------------------------------------

const AT_RISK = new Set(['No', 'No (SF)'])

export function isAtRiskRenewal(r: Pick<Renewal, 'willRenew'>): boolean {
  return AT_RISK.has(r.willRenew ?? '')
}

export interface RenewalQuarterSummary {
  quarter: string
  subscriptions: number
  arr: number
  renewingArr: number
  atRiskArr: number
}

/** Renewals grouped by renewal quarter, in calendar order ("Next Yr" last). */
export function summarizeRenewals(renewals: Renewal[]): RenewalQuarterSummary[] {
  const byQuarter = new Map<string, RenewalQuarterSummary>()
  for (const r of renewals) {
    const quarter = r.renewalQuarter ?? 'Unscheduled'
    const s = byQuarter.get(quarter) ?? { quarter, subscriptions: 0, arr: 0, renewingArr: 0, atRiskArr: 0 }
    s.subscriptions += 1
    s.arr += r.arr
    if (isAtRiskRenewal(r)) s.atRiskArr += r.arr
    else s.renewingArr += r.arr
    byQuarter.set(quarter, s)
  }
  return [...byQuarter.values()].sort((a, b) => quarterOrder(a.quarter) - quarterOrder(b.quarter))
}

/** Sort key for "Q4'26"-style labels; anything else sorts after them. */
export function quarterOrder(label: string): number {
  const m = label.match(/^Q([1-4])'(\d{2})$/)
  return m ? Number(m[2]) * 4 + Number(m[1]) : Number.MAX_SAFE_INTEGER
}

/** Sum a numeric field over rows grouped by a key, largest first. */
export function groupSum<T>(rows: T[], key: (row: T) => string | null, value: (row: T) => number) {
  const totals = new Map<string, { name: string; total: number; count: number }>()
  for (const row of rows) {
    const name = key(row) ?? 'Unassigned'
    const entry = totals.get(name) ?? { name, total: 0, count: 0 }
    entry.total += value(row)
    entry.count += 1
    totals.set(name, entry)
  }
  return [...totals.values()].sort((a, b) => b.total - a.total)
}
