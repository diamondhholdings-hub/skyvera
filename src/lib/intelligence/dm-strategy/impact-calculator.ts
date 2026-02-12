/**
 * DM% Strategy Engine - Impact Calculator
 * Financial modeling for recommendation impacts
 */

import { Result, ok, err } from '@/lib/types/result'
import { DMRecommendation, DMScenarioProjection } from './types'
import { prisma } from '@/lib/db/prisma'

/**
 * Calculate ARR impact of a recommendation
 * Considers confidence level and risk factors
 */
export function calculateARRImpact(
  recommendation: DMRecommendation
): number {
  const baseImpact = recommendation.impact.arrImpact

  // Adjust for confidence level (0-100 becomes 0-1 multiplier)
  const confidenceMultiplier = recommendation.impact.confidenceLevel / 100

  // Adjust for risk level
  const riskMultiplier =
    recommendation.risk === 'high' ? 0.7 : recommendation.risk === 'medium' ? 0.85 : 1.0

  return baseImpact * confidenceMultiplier * riskMultiplier
}

/**
 * Calculate DM% impact of a recommendation
 */
export function calculateDMImpact(
  recommendation: DMRecommendation,
  currentARR: number
): number {
  // DM impact is the percentage point change
  // For example, +2.5 means DM% goes from 94.7% to 97.2%
  const baseDMImpact = recommendation.impact.dmImpact

  // Adjust for confidence
  const confidenceMultiplier = recommendation.impact.confidenceLevel / 100

  // Adjust for risk
  const riskMultiplier =
    recommendation.risk === 'high' ? 0.7 : recommendation.risk === 'medium' ? 0.85 : 1.0

  return baseDMImpact * confidenceMultiplier * riskMultiplier
}

/**
 * Calculate margin impact of a recommendation
 */
export function calculateMarginImpact(
  recommendation: DMRecommendation
): number {
  const baseMarginImpact = recommendation.impact.marginImpact

  // Adjust for confidence
  const confidenceMultiplier = recommendation.impact.confidenceLevel / 100

  // Adjust for risk
  const riskMultiplier =
    recommendation.risk === 'high' ? 0.7 : recommendation.risk === 'medium' ? 0.85 : 1.0

  return baseMarginImpact * confidenceMultiplier * riskMultiplier
}

/**
 * Project scenario: What happens if all recommendations are accepted?
 */
export async function projectScenario(
  recommendations: DMRecommendation[],
  bu?: string
): Promise<Result<DMScenarioProjection>> {
  try {
    // Fetch baseline metrics
    const customers = await prisma.customer.findMany({
      where: bu ? { bu } : {},
      include: {
        subscriptions: true,
      },
    })

    // Calculate baseline
    let totalARR = 0
    let totalProjectedARR = 0
    let totalRevenue = 0

    for (const customer of customers) {
      const arr = customer.subscriptions.reduce(
        (sum, sub) => sum + (sub.arr || 0),
        0
      )
      const projectedArr = customer.subscriptions.reduce(
        (sum, sub) => sum + (sub.projectedArr || sub.arr || 0),
        0
      )

      totalARR += arr
      totalProjectedARR += projectedArr
      totalRevenue += customer.totalRevenue
    }

    const baselineDM = totalARR > 0 ? (totalProjectedARR / totalARR) * 100 : 100

    // Calculate projected impact from recommendations
    let totalARRImpact = 0
    let totalDMImpact = 0

    for (const rec of recommendations) {
      // Find the account
      const account = customers.find(
        (c) => c.customerName === rec.accountName
      )
      if (!account) continue

      const accountARR = account.subscriptions.reduce(
        (sum, sub) => sum + (sub.arr || 0),
        0
      )

      totalARRImpact += calculateARRImpact(rec)
      totalDMImpact += calculateDMImpact(rec, accountARR)
    }

    // Calculate projected state
    const projectedTotalARR = totalARR + totalARRImpact
    const projectedTotalProjectedARR = totalProjectedARR + totalARRImpact
    const projectedDM =
      projectedTotalARR > 0
        ? (projectedTotalProjectedARR / projectedTotalARR) * 100
        : 100

    // Determine confidence level
    const avgConfidence =
      recommendations.reduce(
        (sum, rec) => sum + rec.impact.confidenceLevel,
        0
      ) / recommendations.length

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      avgConfidence >= 80 ? 'HIGH' : avgConfidence >= 60 ? 'MEDIUM' : 'LOW'

    const projection: DMScenarioProjection = {
      baseline: {
        totalARR,
        avgDM: baselineDM,
        totalRevenue,
      },
      projected: {
        totalARR: projectedTotalARR,
        avgDM: projectedDM,
        totalRevenue: totalRevenue + totalARRImpact, // Simplified
      },
      impact: {
        arrChange: totalARRImpact,
        arrChangePercent: totalARR > 0 ? (totalARRImpact / totalARR) * 100 : 0,
        dmChange: projectedDM - baselineDM,
        dmChangePercent:
          baselineDM > 0 ? ((projectedDM - baselineDM) / baselineDM) * 100 : 0,
      },
      recommendationsIncluded: recommendations.length,
      confidence,
    }

    return ok(projection)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to project scenario')
    )
  }
}

/**
 * Calculate ROI for a recommendation (ARR impact / implementation cost)
 */
export function calculateROI(
  recommendation: DMRecommendation,
  estimatedImplementationCost: number = 0
): number {
  const arrImpact = calculateARRImpact(recommendation)

  // If no cost estimate, use timeline as proxy
  let cost = estimatedImplementationCost
  if (cost === 0) {
    // Rough cost estimates based on timeline
    switch (recommendation.timeline) {
      case 'immediate':
        cost = 5000 // Quick CSM action
        break
      case 'short-term':
        cost = 15000 // Moderate effort
        break
      case 'medium-term':
        cost = 50000 // Significant project
        break
      case 'long-term':
        cost = 100000 // Major initiative
        break
    }
  }

  return cost > 0 ? arrImpact / cost : arrImpact
}

/**
 * Calculate payback period (months to recover implementation cost)
 */
export function calculatePaybackPeriod(
  recommendation: DMRecommendation,
  estimatedImplementationCost: number = 0
): number {
  const arrImpact = calculateARRImpact(recommendation)
  const monthlyImpact = arrImpact / 12 // Convert ARR to monthly

  let cost = estimatedImplementationCost
  if (cost === 0) {
    // Use same timeline-based estimates
    switch (recommendation.timeline) {
      case 'immediate':
        cost = 5000
        break
      case 'short-term':
        cost = 15000
        break
      case 'medium-term':
        cost = 50000
        break
      case 'long-term':
        cost = 100000
        break
    }
  }

  return monthlyImpact > 0 ? cost / monthlyImpact : Infinity
}

/**
 * Rank recommendations by expected value (EV = impact × confidence)
 */
export function rankByExpectedValue(
  recommendations: DMRecommendation[]
): DMRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const evA =
      calculateARRImpact(a) * (a.impact.confidenceLevel / 100)
    const evB =
      calculateARRImpact(b) * (b.impact.confidenceLevel / 100)
    return evB - evA // Descending order
  })
}

/**
 * Group recommendations by type with aggregate impact
 */
export function groupByType(recommendations: DMRecommendation[]): Record<
  string,
  {
    count: number
    totalARRImpact: number
    avgConfidence: number
    recommendations: DMRecommendation[]
  }
> {
  const grouped: Record<
    string,
    {
      count: number
      totalARRImpact: number
      avgConfidence: number
      recommendations: DMRecommendation[]
    }
  > = {}

  for (const rec of recommendations) {
    if (!grouped[rec.type]) {
      grouped[rec.type] = {
        count: 0,
        totalARRImpact: 0,
        avgConfidence: 0,
        recommendations: [],
      }
    }

    grouped[rec.type].count++
    grouped[rec.type].totalARRImpact += calculateARRImpact(rec)
    grouped[rec.type].avgConfidence += rec.impact.confidenceLevel
    grouped[rec.type].recommendations.push(rec)
  }

  // Calculate averages
  for (const type in grouped) {
    grouped[type].avgConfidence /= grouped[type].count
  }

  return grouped
}
