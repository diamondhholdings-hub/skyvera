/**
 * Server-side data fetching for dashboard KPIs and BU summaries
 * These functions are called directly from Server Components (no API routes)
 * Bridges ConnectorFactory/Excel adapter to UI layer
 */

import { getConnectorFactory } from '../registry/connector-factory'
import type { BU, BUFinancialSummary } from '@/lib/types/financial'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, getActiveTTL } from '@/lib/cache/manager'
import { getIntelligence, isAtRiskRenewal, type IntelligenceSnapshot, type Renewal } from './intelligence-data'
import { getFiscalQuarter } from './fiscal-quarter'

/**
 * Dashboard overview data
 */
export interface DashboardData {
  totalRevenue: number
  totalRR: number
  rrTarget: number // Real Prior Plan RR from the Excel P&L sheet
  totalNRR: number
  ebitda: number
  ebitdaTarget: number
  netMarginPct: number
  netMarginTarget: number // Real blended Margin Target from the Excel P&L sheet
  headcount: number // Quarter-end headcount from the HC sheets (0 when the intelligence snapshot is missing)
  headcountPriorQuarter: number | null
  headcountCost: number | null // Quarterly headcount cost for the current quarter
  arAgingOver90: number | null // Real AR > 90 days total from the 'AR Aging' sheet
  arrYoYChangePct: number | null // Real YoY revenue change from the Comparison-to-PP sheets
  ruleOf40: number | null // arrYoYChangePct + netMarginPct
  arrAtRisk: ArrAtRisk | null // Renewals marked "No" / "No (SF)" in the next 4 quarters
  lastUpdated: Date
}

/** ARR on subscriptions marked as not renewing within a quarter window. */
export interface ArrAtRisk {
  quarters: string[]
  arr: number
  subscriptions: number
  customers: number
}

/** Shift a "Q4'26"-style label by n quarters ("Q4'26" + 1 = "Q1'27"). Null if unparseable. */
export function shiftQuarter(label: string, n: number): string | null {
  const m = label.match(/^Q([1-4])'(\d{2})$/)
  if (!m) return null
  const index = Number(m[2]) * 4 + (Number(m[1]) - 1) + n
  const year = Math.floor(index / 4)
  return `Q${(index % 4) + 1}'${String(year).padStart(2, '0')}`
}

/** `count` consecutive quarter labels starting at `start`. */
export function quarterWindow(start: string, count: number): string[] {
  const quarters: string[] = []
  for (let i = 0; i < count; i++) {
    const q = shiftQuarter(start, i)
    if (q) quarters.push(q)
  }
  return quarters
}

/** At-risk ARR on renewals whose renewal quarter falls inside `quarters`. */
export function computeArrAtRisk(renewals: Renewal[], quarters: string[]): ArrAtRisk {
  const window = new Set(quarters)
  const atRisk = renewals.filter((r) => r.renewalQuarter && window.has(r.renewalQuarter) && isAtRiskRenewal(r))
  return {
    quarters,
    arr: atRisk.reduce((sum, r) => sum + r.arr, 0),
    subscriptions: atRisk.length,
    customers: new Set(atRisk.map((r) => r.customer)).size,
  }
}

/** Quarter-end headcount, prior quarter headcount and quarterly cost from the HC sheets. */
export function headcountFromIntelligence(
  intel: Pick<IntelligenceSnapshot, 'headcount'>,
  quarter: string | null
): { headcount: number; headcountPriorQuarter: number | null; headcountCost: number | null } {
  const summary = intel.headcount.summary?.['Total XO']
  const total = intel.headcount.total
  const firstQuarter = intel.headcount.quarters?.[0]
  const costKey = quarter && total.cost[quarter] !== undefined ? quarter : firstQuarter
  return {
    headcount: summary?.headcountEndOfQuarter ?? total.headcount,
    headcountPriorQuarter: summary?.priorQuarterHeadcount ?? null,
    headcountCost: summary?.cost ?? (costKey ? total.cost[costKey] ?? null : null),
  }
}

/**
 * Revenue trend data point for charts
 */
export interface RevenueTrendPoint {
  quarter: string
  revenue: number
  target: number
}

/**
 * Financial summary extracted from Excel
 */
interface FinancialSummary {
  bu: string
  totalRR: number
  totalNRR: number
  totalRevenue: number
  cogs: number
  headcountCost: number
  vendorCost: number
  coreAllocation: number
  ebitda: number
  netMargin: number
  customerCount: number
  marginTarget?: number
  rrPriorPlan?: number
  arAgingOver90?: number | null
  arrYoYChangePct?: number | null
  ruleOf40?: number | null
}

/**
 * Get consolidated dashboard data for all BUs
 * Cached with 5-minute TTL (30min in DEMO_MODE)
 */
export async function getDashboardData(): Promise<Result<DashboardData, Error>> {
  const cache = getCacheManager()
  const ttl = getActiveTTL()

  return cache.get(
    'dashboard:overview',
    async () => {
      try {
        const factory = await getConnectorFactory()

        // Fetch financials for all BUs
        const result = await factory.getData('excel', {
          type: 'financials',
          filters: {},
        })

        if (!result.success) {
          console.error('[getDashboardData] Failed to fetch financials:', result.error)
          return err(result.error)
        }

        const allFinancials = result.value.data as FinancialSummary[]

        // 'Skyvera' is the consolidated company-wide entry (from the 'P&Ls'
        // sheet) — use it directly rather than re-summing the per-BU entries,
        // which would double-count revenue since 'Skyvera' is also present
        // in this same array.
        const consolidated = allFinancials.find((f) => f.bu === 'Skyvera')

        if (!consolidated) {
          return err(new Error("Consolidated 'Skyvera' financials not found in Excel data"))
        }

        const totalRevenue = consolidated.totalRevenue
        const totalRR = consolidated.totalRR
        const totalNRR = consolidated.totalNRR
        const totalEbitda = consolidated.ebitda
        const netMarginPct = consolidated.netMargin

        // Real Prior Plan RR from the Excel P&L sheet (falls back to current
        // RR — i.e. zero apparent variance — if the workbook has no Prior
        // Plan column for this quarter).
        const rrTarget = consolidated.rrPriorPlan ?? totalRR

        // Real blended Margin Target from the Excel P&L sheet.
        const netMarginTarget = consolidated.marginTarget ?? netMarginPct
        const ebitdaTarget = (totalRevenue * netMarginTarget) / 100

        // Headcount and at-risk renewals come from the intelligence snapshot
        // (HC sheets and renewal tracker of the same workbook).
        const intel = getIntelligence()
        const quarter = getFiscalQuarter()
        const hc = intel
          ? headcountFromIntelligence(intel, quarter)
          : { headcount: 0, headcountPriorQuarter: null, headcountCost: null }
        const startQuarter = quarter ?? intel?.headcount.quarters?.[0] ?? null
        const arrAtRisk =
          intel && startQuarter ? computeArrAtRisk(intel.renewals, quarterWindow(startQuarter, 4)) : null
        const arAgingOver90 =
          consolidated.arAgingOver90 ??
          (intel ? intel.receivables.reduce((sum, r) => sum + r.arOver90, 0) : null)

        return ok({
          totalRevenue,
          totalRR,
          rrTarget,
          totalNRR,
          ebitda: totalEbitda,
          ebitdaTarget,
          netMarginPct,
          netMarginTarget,
          ...hc,
          arAgingOver90,
          arrYoYChangePct: consolidated.arrYoYChangePct ?? null,
          ruleOf40: consolidated.ruleOf40 ?? null,
          arrAtRisk,
          lastUpdated: new Date(),
        })
      } catch (error) {
        console.error('[getDashboardData] Unexpected error:', error)
        return err(
          new Error(
            `Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    },
    { ttl: ttl.FINANCIAL }
  )
}

/**
 * Get per-BU financial summaries
 * Cached with 5-minute TTL (30min in DEMO_MODE)
 */
export async function getBUSummaries(): Promise<Result<BUFinancialSummary[], Error>> {
  const cache = getCacheManager()
  const ttl = getActiveTTL()

  return cache.get(
    'dashboard:bu-summaries',
    async () => {
      try {
        const factory = await getConnectorFactory()

        // Fetch financials for all BUs
        const result = await factory.getData('excel', {
          type: 'financials',
          filters: {},
        })

        if (!result.success) {
          console.error('[getBUSummaries] Failed to fetch financials:', result.error)
          return err(result.error)
        }

        const allFinancials = result.value.data as FinancialSummary[]

        // 'Skyvera' is the consolidated company-wide entry, not a BU — exclude
        // it from the per-BU performance table.
        const perBU = allFinancials.filter((f) => f.bu !== 'Skyvera')

        // Map to BUFinancialSummary using each BU's real Margin Target and
        // Prior Plan RR from its Excel P&L sheet.
        const summaries: BUFinancialSummary[] = perBU.map((financial) => ({
          bu: financial.bu as BU,
          totalRR: financial.totalRR,
          totalNRR: financial.totalNRR,
          totalRevenue: financial.totalRevenue,
          customerCount: financial.customerCount,
          netMarginPct: financial.netMargin,
          netMarginTarget: financial.marginTarget ?? financial.netMargin,
          ebitda: financial.ebitda,
          rrPriorPlan: financial.rrPriorPlan,
        }))

        return ok(summaries)
      } catch (error) {
        console.error('[getBUSummaries] Unexpected error:', error)
        return err(
          new Error(
            `Failed to fetch BU summaries: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    },
    { ttl: ttl.FINANCIAL }
  )
}

/**
 * Get revenue trend data for charts (demo: generate quarterly data)
 * Cached with 5-minute TTL (30min in DEMO_MODE)
 */
export async function getRevenueTrendData(): Promise<Result<RevenueTrendPoint[], Error>> {
  const cache = getCacheManager()
  const ttl = getActiveTTL()

  return cache.get(
    'dashboard:revenue-trend',
    async () => {
      try {
        const dashboardResult = await getDashboardData()

        if (!dashboardResult.success) {
          return err(dashboardResult.error)
        }

        const { totalRevenue } = dashboardResult.value

        // Demo: Generate Q1-Q4 data using current quarter as Q1'26
        // Simulate historical trend (Q2'25 - Q1'26)
        const quarters = ["Q2'25", "Q3'25", "Q4'25", "Q1'26"]
        const growthRate = 1.03 // 3% quarterly growth

        const trendData: RevenueTrendPoint[] = quarters.map((quarter, index) => {
          // Q1'26 is the latest (index 3), work backwards
          const periodsBack = quarters.length - 1 - index
          const revenue = totalRevenue / Math.pow(growthRate, periodsBack)
          const target = revenue * 1.05 // Target 5% above actual

          return {
            quarter,
            revenue: Math.round(revenue),
            target: Math.round(target),
          }
        })

        return ok(trendData)
      } catch (error) {
        console.error('[getRevenueTrendData] Unexpected error:', error)
        return err(
          new Error(
            `Failed to fetch revenue trend: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    },
    { ttl: ttl.FINANCIAL }
  )
}
