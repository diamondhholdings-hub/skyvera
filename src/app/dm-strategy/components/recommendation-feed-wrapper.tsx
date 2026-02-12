'use client'

/**
 * Recommendation Feed Wrapper
 * Client component wrapper for filtering logic
 */

import { useState, useMemo } from 'react'
import type { DMRecommendation } from '@/lib/types/dm-strategy'
import RecommendationFilters from './recommendation-filters'
import type { FilterOption } from '@/app/dm-strategy/types'
import { RecommendationFeed } from './recommendation-feed'
import { ImpactCalculator } from './impact-calculator-widget'

interface RecommendationFeedWrapperProps {
  recommendations: DMRecommendation[]
  currentDM: number
  targetDM: number
}

export function RecommendationFeedWrapper({
  recommendations,
  currentDM,
  targetDM,
}: RecommendationFeedWrapperProps) {
  const [activeFilterId, setActiveFilterId] = useState<string>('all')

  const filteredRecommendations = useMemo(() => {
    switch (activeFilterId) {
      case 'critical':
        return recommendations.filter((r) => r.priority === 'critical')
      case 'high-impact':
        return recommendations.filter((r) => r.estimatedARRImpact >= 500000)
      case 'quick-wins':
        return recommendations.filter(
          (r) => r.estimatedEffort === 'low' && r.estimatedARRImpact >= 100000
        )
      case 'all':
      default:
        return recommendations
    }
  }, [recommendations, activeFilterId])

  // Build filter options with counts
  const filterOptions: FilterOption[] = [
    {
      id: 'all',
      label: 'All',
      count: recommendations.length,
      active: activeFilterId === 'all',
    },
    {
      id: 'critical',
      label: 'Critical',
      count: recommendations.filter((r) => r.priority === 'critical').length,
      active: activeFilterId === 'critical',
    },
    {
      id: 'high-impact',
      label: 'High Impact',
      count: recommendations.filter((r) => r.estimatedARRImpact >= 500000).length,
      active: activeFilterId === 'high-impact',
    },
    {
      id: 'quick-wins',
      label: 'Quick Wins',
      count: recommendations.filter(
        (r) => r.estimatedEffort === 'low' && r.estimatedARRImpact >= 100000
      ).length,
      active: activeFilterId === 'quick-wins',
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Feed */}
      <div className="lg:col-span-2">
        <RecommendationFilters filters={filterOptions} onFilterChange={setActiveFilterId} />
        <RecommendationFeed recommendations={filteredRecommendations} />
      </div>

      {/* Impact Calculator Sidebar */}
      <div className="lg:col-span-1">
        <ImpactCalculator
          recommendations={filteredRecommendations}
          currentDM={currentDM}
          targetDM={targetDM}
        />
      </div>
    </div>
  )
}
