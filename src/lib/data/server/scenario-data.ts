/**
 * Server-side data fetching for scenario modeling baseline metrics
 */

import { getDashboardData, getBUSummaries } from './dashboard-data'
import { ok, err, type Result } from '@/lib/types/result'

/**
 * Baseline metrics for scenario calculations
 */
export interface BaselineMetrics {
  totalRevenue: number
  totalRR: number
  totalNRR: number
  ebitda: number
  ebitdaTarget: number
  netMarginPct: number
  netMarginTarget: number
  headcount: number
  headcountCost: number
  totalCosts: number
  customerCount: number
}

/**
 * Get baseline metrics for scenario modeling
 */
export async function getBaselineMetrics(): Promise<Result<BaselineMetrics, Error>> {
  try {
    // Fetch dashboard data and BU summaries
    const dashboardResult = await getDashboardData()
    const buSummariesResult = await getBUSummaries()

    if (!dashboardResult.success) {
      return err(dashboardResult.error)
    }

    if (!buSummariesResult.success) {
      return err(buSummariesResult.error)
    }

    const dashboard = dashboardResult.value
    const buSummaries = buSummariesResult.value

    // Calculate headcount cost as 8% of revenue (from CLAUDE.md cost structure)
    const headcountCost = dashboard.totalRevenue * 0.08

    // Calculate total costs from net margin
    const totalCosts = dashboard.totalRevenue * (1 - dashboard.netMarginPct / 100)

    // Sum customer count across all BUs
    const customerCount = buSummaries.reduce((sum, bu) => sum + bu.customerCount, 0)

    return ok({
      totalRevenue: dashboard.totalRevenue,
      totalRR: dashboard.totalRR,
      totalNRR: dashboard.totalNRR,
      ebitda: dashboard.ebitda,
      ebitdaTarget: dashboard.ebitdaTarget,
      netMarginPct: dashboard.netMarginPct,
      netMarginTarget: dashboard.netMarginTarget,
      headcount: dashboard.headcount,
      headcountCost,
      totalCosts,
      customerCount,
    })
  } catch (error) {
    console.error('[getBaselineMetrics] Unexpected error:', error)
    return err(
      new Error(
        `Failed to fetch baseline metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}
