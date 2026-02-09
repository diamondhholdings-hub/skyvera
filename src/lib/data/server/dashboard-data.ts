/**
 * Server-side data fetching for dashboard KPIs and BU summaries
 * These functions are called directly from Server Components (no API routes)
 * Bridges ConnectorFactory/Excel adapter to UI layer
 */

import { getConnectorFactory } from '../registry/connector-factory'
import type { BU, BUFinancialSummary } from '@/lib/types/financial'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, getActiveTTL } from '@/lib/cache/manager'

/**
 * Dashboard overview data
 */
export interface DashboardData {
  totalRevenue: number
  totalRR: number
  rrTarget: number // Prior period for comparison
  totalNRR: number
  ebitda: number
  ebitdaTarget: number
  netMarginPct: number
  netMarginTarget: number // 68.7% from CLAUDE.md
  headcount: number
  lastUpdated: Date
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

        // Calculate totals
        let totalRevenue = 0
        let totalRR = 0
        let totalNRR = 0
        let totalEbitda = 0

        for (const financial of allFinancials) {
          totalRevenue += financial.totalRevenue
          totalRR += financial.totalRR
          totalNRR += financial.totalNRR
          totalEbitda += financial.ebitda
        }

        // Calculate net margin percentage
        const netMarginPct = totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0

        // RR target: use prior period (assume 5% growth for demo)
        const rrTarget = totalRR * 0.95

        // EBITDA target: based on 68.7% net margin target from CLAUDE.md
        const netMarginTarget = 68.7
        const ebitdaTarget = (totalRevenue * netMarginTarget) / 100

        // Headcount from CLAUDE.md: 58 FTEs
        const headcount = 58

        return ok({
          totalRevenue,
          totalRR,
          rrTarget,
          totalNRR,
          ebitda: totalEbitda,
          ebitdaTarget,
          netMarginPct,
          netMarginTarget,
          headcount,
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

        // Targets from CLAUDE.md: Cloudsense 63.6%, Kandy 75%, STL 75%
        const netMarginTargets: Record<string, number> = {
          Cloudsense: 63.6,
          Kandy: 75,
          STL: 75,
          NewNet: 70, // Default if exists
        }

        // Map to BUFinancialSummary
        const summaries: BUFinancialSummary[] = allFinancials.map((financial) => ({
          bu: financial.bu as BU,
          totalRR: financial.totalRR,
          totalNRR: financial.totalNRR,
          totalRevenue: financial.totalRevenue,
          customerCount: financial.customerCount,
          netMarginPct: financial.netMargin,
          netMarginTarget: netMarginTargets[financial.bu] || 70,
          ebitda: financial.ebitda,
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
