/**
 * Canned Queries Component
 * Displays categorized pre-programmed queries with filter selection
 */

'use client'

import { useState } from 'react'
import { CannedQuery, QueryFilters } from '@/lib/intelligence/nlq/types'

interface CannedQueriesProps {
  queries: CannedQuery[]
  onQuerySelect: (query: CannedQuery, filters?: QueryFilters) => void
}

const CATEGORY_ORDER: Array<CannedQuery['category']> = [
  'performance',
  'customers',
  'financials',
  'comparisons',
]

const CATEGORY_LABELS: Record<CannedQuery['category'], string> = {
  performance: 'PERFORMANCE',
  customers: 'CUSTOMERS',
  financials: 'FINANCIALS',
  comparisons: 'COMPARISONS',
}

const BU_OPTIONS = ['Cloudsense', 'Kandy', 'STL']

export function CannedQueries({ queries, onQuerySelect }: CannedQueriesProps) {
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)
  const [selectedBU, setSelectedBU] = useState<string>('')

  // Group queries by category
  const groupedQueries = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = queries.filter((q) => q.category === category)
      return acc
    },
    {} as Record<CannedQuery['category'], CannedQuery[]>
  )

  const handleQueryClick = (query: CannedQuery) => {
    // Check if query requires filters
    const requiresBU = query.requiredFilters?.includes('bu')

    if (requiresBU) {
      // Show filter selection
      setSelectedQueryId(query.id)
      setSelectedBU('')
    } else {
      // Execute immediately
      onQuerySelect(query)
    }
  }

  const handleFilterSubmit = (query: CannedQuery) => {
    const filters: QueryFilters = {}
    if (selectedBU) {
      filters.bu = selectedBU
    }

    onQuerySelect(query, filters)
    setSelectedQueryId(null)
    setSelectedBU('')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-display font-semibold text-[var(--secondary)]">Common Questions</h2>

      {CATEGORY_ORDER.map((category) => {
        const categoryQueries = groupedQueries[category]
        if (categoryQueries.length === 0) return null

        return (
          <div key={category} className="space-y-2">
            {/* Category header */}
            <h3 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </h3>

            {/* Query cards */}
            <div className="space-y-2">
              {categoryQueries.map((query) => {
                const isExpanded = selectedQueryId === query.id
                const requiresFilters = query.requiredFilters && query.requiredFilters.length > 0
                const requiresBU = query.requiredFilters?.includes('bu')

                return (
                  <div key={query.id}>
                    {/* Query card */}
                    <button
                      onClick={() => handleQueryClick(query)}
                      className="w-full text-left p-4 bg-white border border-[var(--border)] rounded
                                 cursor-pointer hover:border-[var(--accent)] hover:shadow-sm
                                 transition-all
                                 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-display text-base font-semibold text-[var(--secondary)] group-hover:text-[var(--accent)]">
                          {query.label}
                        </span>
                        {requiresFilters && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--warning)]/10 text-[var(--warning)] rounded-full flex-shrink-0">
                            requires filters
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Filter selection (shown when expanded) */}
                    {isExpanded && requiresBU && (
                      <div className="mt-2 p-3 bg-[var(--highlight)] border border-[var(--border)] rounded-lg space-y-3">
                        <label className="block">
                          <span className="text-xs font-medium text-[var(--ink)] uppercase tracking-wide">
                            Select Business Unit
                          </span>
                          <select
                            value={selectedBU}
                            onChange={(e) => setSelectedBU(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border-2 border-[var(--border)] rounded-md
                                       focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                                       text-sm"
                          >
                            <option value="">Choose...</option>
                            {BU_OPTIONS.map((bu) => (
                              <option key={bu} value={bu}>
                                {bu}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFilterSubmit(query)}
                            disabled={!selectedBU}
                            className="flex-1 px-3 py-1.5 bg-[var(--accent)] text-white rounded-md
                                       hover:bg-[var(--accent)]/90 disabled:bg-[var(--muted)]
                                       disabled:cursor-not-allowed
                                       text-sm font-medium
                                       transition-colors"
                          >
                            Run Query
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQueryId(null)
                              setSelectedBU('')
                            }}
                            className="px-3 py-1.5 border border-[var(--border)] text-[var(--ink)] rounded-md
                                       hover:bg-[var(--highlight)]
                                       text-sm font-medium
                                       transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
