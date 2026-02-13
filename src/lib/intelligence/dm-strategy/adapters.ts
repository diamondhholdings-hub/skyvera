/**
 * Type Adapters for DM% Strategy System
 * Transforms backend snake_case data to frontend camelCase UI format
 *
 * This adapter layer bridges:
 * - Backend: BUDMData, DMTrackerData (snake_case from database/Excel)
 * - Frontend: BusinessUnitMetrics, DashboardStats (camelCase for React components)
 */

import type { BUDMData, DMTrackerData, DMQuarterData } from '@/lib/data/server/dm-tracker-data'
import type { DMRecommendation as DataLayerDMRecommendation } from '@/lib/types/dm-strategy'
import type {
  BusinessUnitMetrics,
  DashboardStats,
  MonthlyDMData,
  Recommendation,
  BusinessUnit,
  Priority,
  TrendDirection,
} from '@/app/dm-strategy/types'

/**
 * Map backend BU names to frontend BusinessUnit enum
 */
function mapBusinessUnit(bu: string): BusinessUnit {
  // Normalize to handle variations
  const normalized = bu.trim()

  if (normalized.toLowerCase().includes('cloudsense')) return 'Cloudsense'
  if (normalized.toLowerCase().includes('kandy')) return 'Kandy'
  if (normalized.toLowerCase().includes('stl')) return 'STL'

  // Default to first BU if unrecognized (shouldn't happen with real data)
  console.warn(`[Adapter] Unrecognized BU: "${bu}", defaulting to Cloudsense`)
  return 'Cloudsense'
}

/**
 * Get BU brand color
 */
function getBUColor(bu: BusinessUnit): string {
  const colorMap: Record<BusinessUnit, string> = {
    Cloudsense: '#0066A1',
    Kandy: '#00B8D4',
    STL: '#27AE60',
  }
  return colorMap[bu]
}

/**
 * Calculate trend direction from quarterly history
 */
function calculateTrend(quarters: DMQuarterData[]): { direction: TrendDirection; value: number } {
  if (quarters.length < 2) {
    return { direction: 'neutral', value: 0 }
  }

  // Compare most recent quarter to 3 quarters ago (or earliest available)
  const recent = quarters[quarters.length - 1]
  const older = quarters[Math.max(0, quarters.length - 4)]

  const change = recent.dm_pct - older.dm_pct

  if (change > 0.5) return { direction: 'up', value: change }
  if (change < -0.5) return { direction: 'down', value: change }
  return { direction: 'neutral', value: change }
}

/**
 * Transform quarterly data to monthly format for charts
 * Note: Backend provides quarterly data, frontend expects monthly
 * We interpolate to provide smooth trend lines
 */
function transformToMonthlyData(quarters: DMQuarterData[], targetDM: number): MonthlyDMData[] {
  if (quarters.length === 0) return []

  const monthlyData: MonthlyDMData[] = []

  // For each quarter, create 3 monthly data points with interpolation
  for (let i = 0; i < quarters.length; i++) {
    const quarter = quarters[i]
    const nextQuarter = quarters[i + 1]

    // Parse quarter string (e.g., "Q1'25" -> month names)
    const [q, year] = quarter.quarter.split("'")
    const quarterNum = parseInt(q.replace('Q', ''))
    const monthNames = getMonthsForQuarter(quarterNum, year)

    // If we have next quarter, interpolate; otherwise use current value
    const startDM = quarter.dm_pct
    const endDM = nextQuarter ? nextQuarter.dm_pct : startDM
    const startRevenue = quarter.rr
    const endRevenue = nextQuarter ? nextQuarter.rr : startRevenue

    for (let m = 0; m < 3; m++) {
      const progress = m / 3 // 0, 0.33, 0.67
      monthlyData.push({
        month: monthNames[m],
        dmPercent: startDM + (endDM - startDM) * progress,
        revenue: startRevenue + (endRevenue - startRevenue) * progress,
        targetDM,
      })
    }
  }

  // Return last 12 months
  return monthlyData.slice(-12)
}

/**
 * Get month names for a given quarter
 */
function getMonthsForQuarter(quarterNum: number, year: string): string[] {
  const months = [
    ['Jan', 'Feb', 'Mar'],
    ['Apr', 'May', 'Jun'],
    ['Jul', 'Aug', 'Sep'],
    ['Oct', 'Nov', 'Dec'],
  ]

  return months[quarterNum - 1].map(m => `${m} ${year}`)
}

/**
 * Transform BUDMData to BusinessUnitMetrics
 */
export function adaptBUToBusinessUnitMetrics(
  bu: BUDMData,
  recommendationCount: number,
  accountCount: number
): BusinessUnitMetrics {
  const name = mapBusinessUnit(bu.bu)
  const trend = calculateTrend(bu.ttm_quarters)
  const targetDM = 95.0 // Standard target

  // Calculate three-period DM%
  const ttmDM = bu.dm_pct // Trailing 12 months
  const quarterlyDM = bu.ttm_quarters.length > 0
    ? bu.ttm_quarters[bu.ttm_quarters.length - 1].dm_pct
    : bu.dm_pct
  const monthlyDM = quarterlyDM // Most recent quarter as proxy for monthly

  return {
    name,
    currentDM: ttmDM,
    monthlyDM,
    quarterlyDM,
    ttmDM,
    targetDM,
    trend: trend.direction,
    trendValue: trend.value,
    arr: bu.current_rr,
    accountCount,
    recommendationCount,
    color: getBUColor(name),
    history: transformToMonthlyData(bu.ttm_quarters, targetDM),
  }
}

/**
 * Transform DMTrackerData to DashboardStats
 */
export function adaptTrackerDataToDashboardStats(
  dmData: DMTrackerData,
  recommendations: DataLayerDMRecommendation[],
  accountCount: number
): DashboardStats {
  const consolidated = dmData.consolidated

  // Calculate three-period DM%
  const ttmDM = consolidated.dm_pct
  const recentQuarters = consolidated.ttm_quarters.slice(-2)
  const quarterlyDM = recentQuarters.length > 0 ? recentQuarters[recentQuarters.length - 1].dm_pct : ttmDM
  const monthlyDM = quarterlyDM // Most recent quarter as proxy for monthly

  // Calculate potential ARR impact from all pending recommendations
  const potentialARR = recommendations
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.estimatedARRImpact || 0), 0)

  // Count at-risk accounts (BUs below 90% target)
  const atRiskAccounts = dmData.business_units.filter(bu => !bu.meets_target).length

  return {
    currentDM: ttmDM,
    monthlyDM,
    quarterlyDM,
    ttmDM,
    potentialARR,
    activeRecommendations: recommendations.filter(r => r.status === 'pending').length,
    totalAccounts: accountCount,
    atRiskAccounts,
  }
}

/**
 * Map backend recommendation status to frontend status
 */
function mapRecommendationStatus(backendStatus: string): 'pending' | 'accepted' | 'deferred' | 'in_progress' | 'completed' {
  // Data layer has: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  // Frontend expects: 'pending' | 'accepted' | 'deferred' | 'in_progress' | 'completed'
  if (backendStatus === 'dismissed') return 'deferred'
  return backendStatus as 'pending' | 'accepted' | 'deferred' | 'in_progress' | 'completed'
}

/**
 * Transform backend DMRecommendation to frontend Recommendation
 */
export function adaptDMRecommendationToRecommendation(dmRec: DataLayerDMRecommendation): Recommendation {
  // Calculate confidence based on effort and priority
  // Low effort + high priority = higher confidence
  const confidenceMap: Record<string, number> = {
    'low-critical': 95,
    'low-high': 90,
    'low-medium': 80,
    'low-low': 70,
    'medium-critical': 85,
    'medium-high': 80,
    'medium-medium': 70,
    'medium-low': 60,
    'high-critical': 75,
    'high-high': 70,
    'high-medium': 60,
    'high-low': 50,
  }
  const confidence = confidenceMap[`${dmRec.estimatedEffort}-${dmRec.priority}`] || 70

  return {
    id: dmRec.id,
    accountName: dmRec.accountName || 'Portfolio-wide',
    businessUnit: mapBusinessUnit(dmRec.bu),
    priority: dmRec.priority as Priority,
    title: dmRec.title,
    description: dmRec.description,
    dmImpact: dmRec.estimatedDMImpact,
    arrImpact: dmRec.estimatedARRImpact,
    confidence,
    owner: dmRec.owner,
    timeline: dmRec.timeframe,
    risk: mapEffortToRisk(dmRec.estimatedEffort),
    status: mapRecommendationStatus(dmRec.status),
    category: formatCategory(dmRec.type),
    createdAt: dmRec.createdAt,
    dueDate: undefined,
  }
}

/**
 * Map effort level to risk level
 */
function mapEffortToRisk(effort: string): string {
  const riskMap: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }
  return riskMap[effort] || 'Medium'
}

/**
 * Format recommendation type to category
 */
function formatCategory(type: string): string {
  // Data layer types: 'retention' | 'expansion' | 'pricing' | 'product' | 'engagement' | 'health'
  const categoryMap: Record<string, string> = {
    retention: 'Retention',
    expansion: 'Expansion',
    pricing: 'Pricing',
    product: 'Product',
    engagement: 'Engagement',
    health: 'Health',
  }
  return categoryMap[type] || 'Other'
}

/**
 * Transform full DMTrackerData + recommendations to all frontend types
 * This is the main entry point for the adapter layer
 */
export function adaptDMDataForUI(
  dmData: DMTrackerData,
  recommendations: DataLayerDMRecommendation[],
  accountCounts: { [bu: string]: number }
) {
  // Transform business units
  const businessUnits: BusinessUnitMetrics[] = dmData.business_units.map(bu => {
    const recsForBU = recommendations.filter(r => r.bu === bu.bu)
    const accountCount = accountCounts[bu.bu] || 0
    return adaptBUToBusinessUnitMetrics(bu, recsForBU.length, accountCount)
  })

  // Transform dashboard stats
  const totalAccounts = Object.values(accountCounts).reduce((sum, count) => sum + count, 0)
  const dashboardStats = adaptTrackerDataToDashboardStats(dmData, recommendations, totalAccounts)

  // Transform recommendations
  const transformedRecommendations = recommendations.map(adaptDMRecommendationToRecommendation)

  return {
    businessUnits,
    dashboardStats,
    recommendations: transformedRecommendations,
  }
}
