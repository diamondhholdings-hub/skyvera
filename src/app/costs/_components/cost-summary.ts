/**
 * Headline figures for the cost page, derived from the intelligence snapshot.
 * Pure functions so the numbers can be checked outside the page.
 */
import type { IntelligenceSnapshot } from '@/lib/data/server/intelligence-data'

export const CONSOLIDATED = 'Skyvera Consolidated'
export const MODEL = 'Standard Benchmark'

/** Business units in display order; anything else follows, alphabetically */
const BU_ORDER = ['Cloudsense', 'Kandy', 'STL', 'NewNet', 'VoltDelta']

export function sortBUs(names: Iterable<string>): string[] {
  const unique = [...new Set(names)]
  return unique.sort((a, b) => {
    const ia = BU_ORDER.indexOf(a)
    const ib = BU_ORDER.indexOf(b)
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b)
  })
}

/** Business units that appear in the vendor or central-function lines */
export function costBUs(intel: IntelligenceSnapshot): string[] {
  const names: string[] = []
  for (const l of intel.vendors.lines) if (l.bu) names.push(l.bu)
  for (const l of intel.centralFunctions.lines) if (l.bu) names.push(l.bu)
  return sortBUs(names)
}

/** Match ?bu= case-insensitively against known units; null for all units */
export function resolveBU(param: string | undefined, known: string[]): string | null {
  if (!param) return null
  return known.find((b) => b.toLowerCase() === param.toLowerCase()) ?? null
}

export interface CostSummary {
  quarter: string
  priorQuarter: string
  vendorSpend: number
  vendorPriorForecast: number
  vendorCount: number
  vendorsOver50k: number
  centralPeriod: string
  centralPriorPeriod: string
  centralBudgetPeriod: string
  centralCharges: number
  centralPriorForecast: number
  centralPriorBudget: number
  headcount: number
  averageHeadcount: number
  priorHeadcount: number
  hcCost: number
  priorHcCost: number
  costPerHead: number
  aiQuarter: string
  aiYearAgo: string
  aiCost: number
  aiCostYearAgo: number
  hcAiPctOfRevenue: number
  hcAiPctOfRevenueYearAgo: number
  totalCostPct: number
  totalCostModelPct: number
  edgePct: number
  edgeModelPct: number
  varianceVsModel: number
}

function metric(intel: IntelligenceSnapshot, name: string, period: string): number {
  return intel.aiCost.metrics[name]?.[period] ?? 0
}

export function summarizeCosts(intel: IntelligenceSnapshot): CostSummary {
  const quarter = intel.vendors.quarters[0]
  const vendorLines = intel.vendors.lines

  const periods = intel.centralFunctions.periods
  const centralPeriod = periods.find((p) => p === quarter) ?? periods[2] ?? periods[0]
  const centralPriorPeriod = periods.find((p) => /fcst/i.test(p)) ?? periods[1]
  const centralBudgetPeriod = periods.find((p) => /bdt|budget/i.test(p)) ?? periods[0]
  const cfSum = (period: string) =>
    intel.centralFunctions.lines.reduce((s, l) => s + (l.cost[period] ?? 0), 0)

  const hc = intel.headcount
  const xo = hc.summary['Total XO']
  const hcQuarter = hc.quarters[0]
  const hcCost = hc.total.cost[hcQuarter] ?? xo?.cost ?? 0

  const bm = intel.benchmark.summaryPct

  return {
    quarter,
    priorQuarter: intel.vendors.priorQuarter,
    vendorSpend: vendorLines.reduce((s, l) => s + (l.byQuarter[quarter] ?? 0), 0),
    vendorPriorForecast: vendorLines.reduce((s, l) => s + l.priorQuarterForecast, 0),
    vendorCount: vendorLines.length,
    vendorsOver50k: vendorLines.filter((l) => (l.byQuarter[quarter] ?? 0) > 50_000).length,
    centralPeriod,
    centralPriorPeriod,
    centralBudgetPeriod,
    centralCharges: cfSum(centralPeriod),
    centralPriorForecast: cfSum(centralPriorPeriod),
    centralPriorBudget: cfSum(centralBudgetPeriod),
    headcount: xo?.headcountEndOfQuarter ?? hc.total.headcount,
    averageHeadcount: hc.total.averageHeadcount,
    priorHeadcount: xo?.priorQuarterHeadcount ?? 0,
    hcCost,
    priorHcCost: xo?.priorQuarterCost ?? 0,
    costPerHead: hc.total.averageHeadcount ? hcCost / hc.total.averageHeadcount : 0,
    aiQuarter: intel.aiCost.current,
    aiYearAgo: intel.aiCost.yearAgo,
    aiCost: metric(intel, 'AI Cost', intel.aiCost.current),
    aiCostYearAgo: metric(intel, 'AI Cost', intel.aiCost.yearAgo),
    hcAiPctOfRevenue: metric(intel, 'HC + AI Cost on Revenue', intel.aiCost.current),
    hcAiPctOfRevenueYearAgo: metric(intel, 'HC + AI Cost on Revenue', intel.aiCost.yearAgo),
    totalCostPct: bm.totalCost?.[CONSOLIDATED] ?? 0,
    totalCostModelPct: bm.totalCost?.[MODEL] ?? 0,
    edgePct: bm.edge?.[CONSOLIDATED] ?? 0,
    edgeModelPct: bm.edge?.[MODEL] ?? 0,
    varianceVsModel: intel.benchmark.varianceUsd.Total?.[CONSOLIDATED] ?? 0,
  }
}
