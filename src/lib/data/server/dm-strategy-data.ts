/**
 * Server-side data fetching for DM% Strategy Engine
 * Generates recommendations based on DM% tracker data
 * Cached with 10-minute TTL (30min in DEMO_MODE)
 */

import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, getActiveTTL } from '@/lib/cache/manager'
import type {
  DMRecommendation,
  PortfolioSummary,
  BUPortfolioSummary,
  RecommendationFilters,
} from '@/lib/types/dm-strategy'
import { getDMTrackerData } from './dm-tracker-data'

/**
 * Get all DM% recommendations with optional filters
 * Cached with 10-minute TTL (30min in DEMO_MODE)
 */
export async function getDMRecommendations(
  filters?: RecommendationFilters
): Promise<Result<DMRecommendation[], Error>> {
  const cache = getCacheManager()
  const ttl = getActiveTTL()

  // Build cache key with filters
  const cacheKey = filters
    ? `dm-strategy:recommendations:${JSON.stringify(filters)}`
    : 'dm-strategy:recommendations:all'

  return cache.get(
    cacheKey,
    async () => {
      try {
        // Get DM tracker data
        const dmResult = await getDMTrackerData()
        if (!dmResult.success) {
          return err(dmResult.error)
        }

        const dmData = dmResult.value

        // Generate recommendations based on DM% performance
        const recommendations: DMRecommendation[] = []
        const now = new Date()

        for (const bu of dmData.business_units) {
          const dmGap = 90 - bu.dm_pct
          const isUnderperforming = !bu.meets_target

          // Critical: DM% significantly below target
          if (isUnderperforming && dmGap > 5) {
            recommendations.push({
              id: `${bu.bu}-critical-retention`,
              bu: bu.bu as any,
              priority: 'critical',
              type: 'retention',
              status: 'pending',
              title: `Urgent: ${bu.bu} Revenue Retention Below Target`,
              description: `${bu.bu} DM% is ${bu.dm_pct.toFixed(1)}%, ${dmGap.toFixed(1)} points below the 90% target. Immediate action required to prevent further revenue erosion.`,
              rationale: `Current quarterly loss of $${Math.abs(bu.variance / 1000).toFixed(0)}K indicates systematic retention issues. If trend continues, projected annual loss could exceed $${(Math.abs(bu.variance) * 4 / 1000).toFixed(0)}K.`,
              suggestedAction: 'Conduct urgent account health review, identify at-risk customers, deploy retention team to top 10 accounts, and implement immediate engagement plan.',
              estimatedARRImpact: Math.abs(bu.variance) * 4,
              estimatedDMImpact: dmGap * 0.6, // Assuming 60% recovery
              estimatedEffort: 'high',
              timeframe: '30 days',
              createdAt: now,
              updatedAt: now,
            })
          }

          // High: DM% below target but recoverable
          if (isUnderperforming && dmGap <= 5 && dmGap > 2) {
            recommendations.push({
              id: `${bu.bu}-high-engagement`,
              bu: bu.bu as any,
              priority: 'high',
              type: 'engagement',
              status: 'pending',
              title: `Increase ${bu.bu} Customer Engagement`,
              description: `${bu.bu} DM% is ${bu.dm_pct.toFixed(1)}%, slightly below target. Proactive engagement can prevent further decline.`,
              rationale: `Current variance of $${(bu.variance / 1000).toFixed(0)}K suggests early warning signs. Historical data shows engagement initiatives can recover 3-4 percentage points.`,
              suggestedAction: 'Launch quarterly business review (QBR) campaign, increase product adoption touchpoints, and deploy customer success playbooks for mid-tier accounts.',
              estimatedARRImpact: Math.abs(bu.variance) * 3,
              estimatedDMImpact: dmGap * 0.7,
              estimatedEffort: 'medium',
              timeframe: '60 days',
              createdAt: now,
              updatedAt: now,
            })
          }

          // Medium: Expansion opportunity for healthy accounts
          if (bu.meets_target && bu.dm_pct > 95) {
            recommendations.push({
              id: `${bu.bu}-expansion-upsell`,
              bu: bu.bu as any,
              priority: 'medium',
              type: 'expansion',
              status: 'pending',
              title: `${bu.bu} Upsell & Expansion Opportunity`,
              description: `${bu.bu} DM% is strong at ${bu.dm_pct.toFixed(1)}%. Healthy retention creates ideal conditions for expansion.`,
              rationale: 'Strong retention indicates high customer satisfaction. Data shows customers with DM% >95% have 3x higher expansion win rates.',
              suggestedAction: 'Identify top 20 accounts for upsell, prepare expansion proposals, and coordinate with sales teams on cross-sell opportunities.',
              estimatedARRImpact: bu.current_rr * 0.15, // 15% expansion potential
              estimatedDMImpact: 2.0, // Expansion improves DM%
              estimatedEffort: 'medium',
              timeframe: 'Q2\'26',
              createdAt: now,
              updatedAt: now,
            })
          }

          // Product health check
          if (bu.ttm_quarters.length >= 2) {
            const recentQuarters = bu.ttm_quarters.slice(-2)
            const declineTrend = recentQuarters[1].dm_pct < recentQuarters[0].dm_pct - 1

            if (declineTrend) {
              recommendations.push({
                id: `${bu.bu}-product-health`,
                bu: bu.bu as any,
                priority: 'high',
                type: 'product',
                status: 'pending',
                title: `${bu.bu} Product Health Investigation`,
                description: `${bu.bu} shows declining DM% trend over recent quarters. Product satisfaction may be declining.`,
                rationale: 'Sequential quarterly decline suggests product-market fit issues or competitive pressure. Early intervention critical.',
                suggestedAction: 'Conduct product satisfaction surveys, analyze feature adoption metrics, and gather customer feedback on pain points.',
                estimatedARRImpact: bu.current_rr * 0.1,
                estimatedDMImpact: 3.0,
                estimatedEffort: 'high',
                timeframe: '90 days',
                createdAt: now,
                updatedAt: now,
              })
            }
          }

          // Pricing optimization
          if (bu.dm_pct >= 90 && bu.dm_pct < 93) {
            recommendations.push({
              id: `${bu.bu}-pricing-review`,
              bu: bu.bu as any,
              priority: 'low',
              type: 'pricing',
              status: 'pending',
              title: `${bu.bu} Pricing Strategy Review`,
              description: `${bu.bu} DM% is stable at ${bu.dm_pct.toFixed(1)}%. Evaluate pricing model to capture more value.`,
              rationale: 'Stable retention provides opportunity to test pricing changes without significant churn risk.',
              suggestedAction: 'Analyze competitive pricing, conduct value-based pricing study, and test tiered pricing models with new customers.',
              estimatedARRImpact: bu.current_rr * 0.08,
              estimatedDMImpact: 1.5,
              estimatedEffort: 'low',
              timeframe: 'Q3\'26',
              createdAt: now,
              updatedAt: now,
            })
          }
        }

        // Apply filters if provided
        let filteredRecommendations = recommendations

        if (filters) {
          if (filters.bu) {
            filteredRecommendations = filteredRecommendations.filter(
              (r) => r.bu === filters.bu
            )
          }
          if (filters.priority) {
            filteredRecommendations = filteredRecommendations.filter(
              (r) => r.priority === filters.priority
            )
          }
          if (filters.type) {
            filteredRecommendations = filteredRecommendations.filter(
              (r) => r.type === filters.type
            )
          }
          if (filters.status) {
            filteredRecommendations = filteredRecommendations.filter(
              (r) => r.status === filters.status
            )
          }
          if (filters.accountName) {
            filteredRecommendations = filteredRecommendations.filter(
              (r) => r.accountName === filters.accountName
            )
          }
        }

        // Sort by priority (critical > high > medium > low), then by ARR impact
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        filteredRecommendations.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          return b.estimatedARRImpact - a.estimatedARRImpact
        })

        console.log(
          `[getDMRecommendations] Generated ${filteredRecommendations.length} recommendations`
        )

        return ok(filteredRecommendations)
      } catch (error) {
        console.error('[getDMRecommendations] Error:', error)
        return err(
          new Error(
            `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    },
    { ttl: ttl.FINANCIAL * 2 } // 10 min (30 min in DEMO_MODE)
  )
}

/**
 * Get top N urgent recommendations for dashboard widget
 */
export async function getTopUrgentRecommendations(
  limit: number = 5
): Promise<Result<DMRecommendation[], Error>> {
  const allResult = await getDMRecommendations({
    priority: 'critical',
  })

  if (!allResult.success) {
    // Try high priority as fallback
    const highResult = await getDMRecommendations({
      priority: 'high',
    })

    if (!highResult.success) {
      return highResult
    }

    return ok(highResult.value.slice(0, limit))
  }

  // Combine critical and high if we don't have enough critical
  const critical = allResult.value
  if (critical.length >= limit) {
    return ok(critical.slice(0, limit))
  }

  const highResult = await getDMRecommendations({
    priority: 'high',
  })

  if (!highResult.success) {
    return ok(critical)
  }

  const combined = [...critical, ...highResult.value].slice(0, limit)
  return ok(combined)
}

/**
 * Get portfolio summary with DM% and recommendation counts
 */
export async function getDMPortfolioSummary(): Promise<Result<PortfolioSummary, Error>> {
  const cache = getCacheManager()
  const ttl = getActiveTTL()

  return cache.get(
    'dm-strategy:portfolio-summary',
    async () => {
      try {
        const dmResult = await getDMTrackerData()
        if (!dmResult.success) {
          return err(dmResult.error)
        }

        const dmData = dmResult.value

        const recommendationsResult = await getDMRecommendations()
        if (!recommendationsResult.success) {
          return err(recommendationsResult.error)
        }

        const recommendations = recommendationsResult.value

        // Build BU summaries
        const businessUnits: BUPortfolioSummary[] = dmData.business_units.map((bu) => {
          const buRecommendations = recommendations.filter((r) => r.bu === bu.bu)
          const criticalCount = buRecommendations.filter((r) => r.priority === 'critical').length
          const highCount = buRecommendations.filter((r) => r.priority === 'high').length
          const totalImpact = buRecommendations.reduce((sum, r) => sum + r.estimatedARRImpact, 0)

          const dmGap = Math.max(0, 90 - bu.dm_pct)
          const atRiskARR = (dmGap / 100) * bu.current_rr * 4 // Annualized

          return {
            bu: bu.bu as any,
            currentDM: bu.dm_pct,
            targetDM: 90,
            dmGap,
            currentARR: bu.current_rr * 4,
            atRiskARR,
            recommendationCount: buRecommendations.length,
            criticalCount,
            highCount,
            totalEstimatedImpact: totalImpact,
          }
        })

        // Consolidated summary
        const totalARR = businessUnits.reduce((sum, bu) => sum + bu.currentARR, 0)
        const weightedDM = dmData.consolidated.dm_pct
        const totalAtRiskARR = businessUnits.reduce((sum, bu) => sum + bu.atRiskARR, 0)
        const totalRecommendations = recommendations.length
        const criticalRecommendations = recommendations.filter(
          (r) => r.priority === 'critical'
        ).length
        const highRecommendations = recommendations.filter((r) => r.priority === 'high').length
        const totalEstimatedImpact = recommendations.reduce(
          (sum, r) => sum + r.estimatedARRImpact,
          0
        )

        const summary: PortfolioSummary = {
          businessUnits,
          consolidated: {
            totalARR,
            weightedDM,
            targetDM: 90,
            totalAtRiskARR,
            totalRecommendations,
            criticalRecommendations,
            highRecommendations,
            totalEstimatedImpact,
          },
        }

        return ok(summary)
      } catch (error) {
        console.error('[getDMPortfolioSummary] Error:', error)
        return err(
          new Error(
            `Failed to generate portfolio summary: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        )
      }
    },
    { ttl: ttl.FINANCIAL * 2 }
  )
}

/**
 * Get recommendations for a specific account
 */
export async function getAccountRecommendations(
  accountName: string
): Promise<Result<DMRecommendation[], Error>> {
  return getDMRecommendations({ accountName })
}
