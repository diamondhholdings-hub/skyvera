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
  DMScenarioKey,
} from '@/app/dm-strategy/types'
import { classifyDMScenario, checkThresholdViolations } from './analyzer'

/**
 * Map backend BU names to frontend BusinessUnit enum
 */
function mapBusinessUnit(bu: string): BusinessUnit {
  const n = bu.trim().toLowerCase()

  if (n.includes('cloudsense')) return 'Cloudsense'
  if (n.includes('kandy')) return 'Kandy'
  if (n === 'stl' || n.includes('software technology')) return 'STL'
  if (n.includes('newnet') || n === 'new net') return 'NewNet'
  if (n.includes('voltdelta') || n === 'volt delta') return 'voltDelta'
  if (n.includes('service gateway')) return 'Service Gateway'
  if (n.includes('mobilogy')) return 'Mobilogy'
  if (n.includes('peerapp')) return 'Peerapp'
  if (n.includes('responsetek')) return 'Responsetek'

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
    NewNet: '#7C3AED',
    voltDelta: '#EA580C',
    'Service Gateway': '#0891B2',
    Mobilogy: '#BE185D',
    Peerapp: '#15803D',
    Responsetek: '#B45309',
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
 * One chart point per tracked quarter. The tracker has no monthly data, so
 * nothing is interpolated; `month` carries the quarter label (e.g. "Q4'26").
 * dmPercent is year-over-year RR retention for that quarter.
 */
function transformToChartData(quarters: DMQuarterData[], targetDM: number): MonthlyDMData[] {
  return quarters.map(q => ({
    month: q.quarter,
    dmPercent: q.dm_pct,
    revenue: q.rr,
    targetDM,
  }))
}

/**
 * DM% over three periods from the tracker's quarterly history:
 * - ttm: latest quarter's RR vs the same quarter a year earlier
 * - quarterly: latest quarter's RR vs the previous quarter
 * - monthly: the monthly rate that compounds to the quarterly one (no monthly data exists)
 * Each falls back to the plan comparison when the history is too short.
 */
export function calculatePeriodDMs(
  quarters: DMQuarterData[],
  planDM: number
): { ttmDM: number; quarterlyDM: number; monthlyDM: number } {
  const latest = quarters[quarters.length - 1]
  const previous = quarters[quarters.length - 2]
  const ttmDM = latest ? latest.dm_pct : planDM
  const quarterlyDM = latest && previous && previous.rr > 0 ? (latest.rr / previous.rr) * 100 : planDM
  const monthlyDM = Math.cbrt(quarterlyDM / 100) * 100
  return { ttmDM, quarterlyDM, monthlyDM }
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

  // Scenarios stay keyed to the plan comparison (current-quarter plan vs prior plan)
  const annualDM = bu.dm_pct
  const { ttmDM, quarterlyDM, monthlyDM } = calculatePeriodDMs(bu.ttm_quarters, annualDM)
  const scenario = classifyDMScenario(annualDM)
  const thresholdViolations = checkThresholdViolations(monthlyDM, quarterlyDM, annualDM)

  return {
    name,
    currentDM: annualDM,
    monthlyDM,
    quarterlyDM,
    ttmDM,
    annualDM,
    targetDM,
    trend: trend.direction,
    trendValue: trend.value,
    arr: bu.current_rr,
    accountCount,
    recommendationCount,
    color: getBUColor(name),
    history: transformToChartData(bu.ttm_quarters, targetDM),
    scenario,
    thresholdViolations,
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

  const planDM = consolidated.dm_pct
  const { ttmDM, quarterlyDM, monthlyDM } = calculatePeriodDMs(consolidated.ttm_quarters, planDM)

  // Calculate potential ARR impact from all pending recommendations
  const potentialARR = recommendations
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.estimatedARRImpact || 0), 0)

  // Business units below the 90% floor on the plan comparison (the UI labels it that way)
  const atRiskAccounts = dmData.business_units.filter(bu => !bu.meets_target).length

  // Compute scenario breakdown (count of BUs per A/B/C/D scenario)
  const scenarioBreakdown: Record<DMScenarioKey, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const bu of dmData.business_units) {
    const key = classifyDMScenario(bu.dm_pct)
    scenarioBreakdown[key]++
  }

  return {
    currentDM: planDM,
    monthlyDM,
    quarterlyDM,
    ttmDM,
    potentialARR,
    activeRecommendations: recommendations.filter(r => r.status === 'pending').length,
    totalAccounts: accountCount,
    atRiskAccounts,
    scenarioBreakdown,
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
  // Only the business units the tracker analyzes
  const totalAccounts = dmData.business_units.reduce((sum, bu) => sum + (accountCounts[bu.bu] || 0), 0)
  const dashboardStats = adaptTrackerDataToDashboardStats(dmData, recommendations, totalAccounts)

  // Transform recommendations
  const transformedRecommendations = recommendations.map(adaptDMRecommendationToRecommendation)

  return {
    businessUnits,
    dashboardStats,
    recommendations: transformedRecommendations,
  }
}
