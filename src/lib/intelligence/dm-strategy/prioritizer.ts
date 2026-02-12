/**
 * DM% Strategy Engine - Recommendation Prioritizer
 * Ranks recommendations by impact/effort ROI
 */

import { DMRecommendation, PriorityLevel } from './types'

/**
 * Calculate priority score for a recommendation
 * Formula: (ARR impact × 0.4) + (confidence × 0.3) + (urgency × 0.2) + (ease × 0.1)
 */
function calculatePriorityScore(recommendation: DMRecommendation): number {
  // ARR Impact Score (0-100): Normalize to typical range of $0-$500K
  const arrImpactScore = Math.min(
    100,
    (Math.abs(recommendation.impact.arrImpact) / 500000) * 100
  )

  // Confidence Score (0-100): Already normalized
  const confidenceScore = recommendation.impact.confidenceLevel

  // Urgency Score (0-100): Based on timeline
  const urgencyScore =
    recommendation.timeline === 'immediate'
      ? 100
      : recommendation.timeline === 'short-term'
        ? 75
        : recommendation.timeline === 'medium-term'
          ? 50
          : 25

  // Ease Score (0-100): Inverse of risk and timeline complexity
  const riskScore =
    recommendation.risk === 'low' ? 100 : recommendation.risk === 'medium' ? 60 : 30
  const timelineScore =
    recommendation.timeline === 'immediate'
      ? 100
      : recommendation.timeline === 'short-term'
        ? 80
        : recommendation.timeline === 'medium-term'
          ? 50
          : 30
  const easeScore = (riskScore + timelineScore) / 2

  // Weighted score
  const score =
    arrImpactScore * 0.4 +
    confidenceScore * 0.3 +
    urgencyScore * 0.2 +
    easeScore * 0.1

  return score
}

/**
 * Assign priority level based on score
 */
function assignPriorityLevel(score: number): PriorityLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Prioritize recommendations by calculating scores and assigning levels
 */
export function prioritizeRecommendations(
  recommendations: DMRecommendation[]
): DMRecommendation[] {
  // Calculate scores for all recommendations
  const scoredRecommendations = recommendations.map((rec) => ({
    recommendation: rec,
    score: calculatePriorityScore(rec),
  }))

  // Sort by score (descending)
  scoredRecommendations.sort((a, b) => b.score - a.score)

  // Assign priority levels and return
  return scoredRecommendations.map(({ recommendation, score }) => ({
    ...recommendation,
    priority: assignPriorityLevel(score),
  }))
}

/**
 * Filter recommendations by priority level
 */
export function filterByPriority(
  recommendations: DMRecommendation[],
  priority: PriorityLevel | PriorityLevel[]
): DMRecommendation[] {
  const priorities = Array.isArray(priority) ? priority : [priority]
  return recommendations.filter((rec) => priorities.includes(rec.priority))
}

/**
 * Get top N recommendations by priority score
 */
export function getTopRecommendations(
  recommendations: DMRecommendation[],
  count: number
): DMRecommendation[] {
  const prioritized = prioritizeRecommendations(recommendations)
  return prioritized.slice(0, count)
}

/**
 * Group recommendations by priority level
 */
export function groupByPriority(
  recommendations: DMRecommendation[]
): Record<PriorityLevel, DMRecommendation[]> {
  const grouped: Record<PriorityLevel, DMRecommendation[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  }

  for (const rec of recommendations) {
    grouped[rec.priority].push(rec)
  }

  return grouped
}

/**
 * Calculate aggregate impact of recommendations by priority
 */
export function calculateAggregateImpactByPriority(
  recommendations: DMRecommendation[]
): Record<
  PriorityLevel,
  {
    count: number
    totalARRImpact: number
    totalDMImpact: number
    avgConfidence: number
  }
> {
  const grouped = groupByPriority(recommendations)
  const result: Record<
    PriorityLevel,
    {
      count: number
      totalARRImpact: number
      totalDMImpact: number
      avgConfidence: number
    }
  > = {
    critical: { count: 0, totalARRImpact: 0, totalDMImpact: 0, avgConfidence: 0 },
    high: { count: 0, totalARRImpact: 0, totalDMImpact: 0, avgConfidence: 0 },
    medium: { count: 0, totalARRImpact: 0, totalDMImpact: 0, avgConfidence: 0 },
    low: { count: 0, totalARRImpact: 0, totalDMImpact: 0, avgConfidence: 0 },
  }

  for (const priority of Object.keys(grouped) as PriorityLevel[]) {
    const recs = grouped[priority]
    result[priority].count = recs.length

    if (recs.length > 0) {
      result[priority].totalARRImpact = recs.reduce(
        (sum, rec) => sum + rec.impact.arrImpact,
        0
      )
      result[priority].totalDMImpact = recs.reduce(
        (sum, rec) => sum + rec.impact.dmImpact,
        0
      )
      result[priority].avgConfidence =
        recs.reduce((sum, rec) => sum + rec.impact.confidenceLevel, 0) /
        recs.length
    }
  }

  return result
}

/**
 * Suggest next best actions (top critical/high priority recommendations)
 */
export function suggestNextActions(
  recommendations: DMRecommendation[],
  maxActions: number = 5
): DMRecommendation[] {
  const prioritized = prioritizeRecommendations(recommendations)

  // Get critical and high priority recommendations
  const criticalAndHigh = prioritized.filter(
    (rec) => rec.priority === 'critical' || rec.priority === 'high'
  )

  // If we have enough critical/high, return those
  if (criticalAndHigh.length >= maxActions) {
    return criticalAndHigh.slice(0, maxActions)
  }

  // Otherwise, include some medium priority to fill the quota
  return prioritized.slice(0, maxActions)
}
