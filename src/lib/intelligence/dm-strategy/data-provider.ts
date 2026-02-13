/**
 * DM Strategy Data Provider
 * Server-side data fetching with type adaptation for UI components
 *
 * This module orchestrates:
 * 1. Fetching raw data from backend (getDMTrackerData, getDMRecommendations)
 * 2. Transforming via adapters (snake_case -> camelCase)
 * 3. Providing ready-to-use data for React components
 */

import { ok, err, type Result } from '@/lib/types/result'
import { getDMTrackerData } from '@/lib/data/server/dm-tracker-data'
import { getDMRecommendations } from '@/lib/data/server/dm-strategy-data'
import { adaptDMDataForUI } from './adapters'
import type { BusinessUnitMetrics, DashboardStats, Recommendation } from '@/app/dm-strategy/types'

/**
 * Complete DM Strategy UI data
 */
export interface DMStrategyUIData {
  businessUnits: BusinessUnitMetrics[]
  dashboardStats: DashboardStats
  recommendations: Recommendation[]
}

/**
 * Account counts by business unit
 * TODO: Replace with actual database query when account data is available
 */
const ACCOUNT_COUNTS: { [bu: string]: number } = {
  Cloudsense: 65,
  Kandy: 45,
  STL: 30,
}

/**
 * Get all DM Strategy data transformed for UI consumption
 *
 * @returns BusinessUnitMetrics[], DashboardStats, and Recommendations
 * @example
 * ```tsx
 * const result = await getDMStrategyUIData()
 * if (result.success) {
 *   const { businessUnits, dashboardStats, recommendations } = result.value
 *   return <PortfolioDashboard businessUnits={businessUnits} recommendations={recommendations} />
 * }
 * ```
 */
export async function getDMStrategyUIData(): Promise<Result<DMStrategyUIData, Error>> {
  try {
    // 1. Fetch raw backend data
    const [dmTrackerResult, recommendationsResult] = await Promise.all([
      getDMTrackerData(),
      getDMRecommendations(),
    ])

    // 2. Check for errors
    if (!dmTrackerResult.success) {
      return err(new Error(`Failed to fetch DM tracker data: ${dmTrackerResult.error.message}`))
    }

    if (!recommendationsResult.success) {
      return err(new Error(`Failed to fetch recommendations: ${recommendationsResult.error.message}`))
    }

    // 3. Transform via adapters
    const dmData = dmTrackerResult.value
    const recommendations = recommendationsResult.value

    const uiData = adaptDMDataForUI(dmData, recommendations, ACCOUNT_COUNTS)

    // 4. Return transformed data
    return ok(uiData)
  } catch (error) {
    console.error('[getDMStrategyUIData] Unexpected error:', error)
    return err(error instanceof Error ? error : new Error('Unknown error'))
  }
}

/**
 * Get DM Strategy data for a specific business unit
 *
 * @param buName - Business unit name (e.g., "Cloudsense", "Kandy", "STL")
 * @returns Filtered data for the specified BU
 */
export async function getDMStrategyUIDataForBU(
  buName: string
): Promise<Result<DMStrategyUIData, Error>> {
  const result = await getDMStrategyUIData()

  if (!result.success) {
    return result
  }

  const { businessUnits, recommendations } = result.value

  // Filter for specific BU
  const bu = businessUnits.find(b => b.name === buName)
  if (!bu) {
    return err(new Error(`Business unit not found: ${buName}`))
  }

  const buRecommendations = recommendations.filter(r => r.businessUnit === buName)

  // Recalculate dashboard stats for single BU
  const dashboardStats: DashboardStats = {
    currentDM: bu.ttmDM,
    monthlyDM: bu.monthlyDM,
    quarterlyDM: bu.quarterlyDM,
    ttmDM: bu.ttmDM,
    potentialARR: buRecommendations
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.arrImpact, 0),
    activeRecommendations: buRecommendations.filter(r => r.status === 'pending').length,
    totalAccounts: bu.accountCount,
    atRiskAccounts: bu.ttmDM < bu.targetDM ? 1 : 0,
  }

  return ok({
    businessUnits: [bu],
    dashboardStats,
    recommendations: buRecommendations,
  })
}

/**
 * Check if DM Strategy data is available
 * Useful for conditional rendering or feature flags
 */
export async function isDMStrategyDataAvailable(): Promise<boolean> {
  const result = await getDMStrategyUIData()
  return result.success && result.value.businessUnits.length > 0
}
