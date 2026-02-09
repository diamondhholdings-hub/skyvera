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
      <h2 className="text-lg font-semibold text-slate-900">Common Questions</h2>

      {CATEGORY_ORDER.map((category) => {
        const categoryQueries = groupedQueries[category]
        if (categoryQueries.length === 0) return null

        return (
          <div key={category} className="space-y-2">
            {/* Category header */}
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
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
                      className="w-full text-left p-3 border border-slate-200 rounded-lg
                                 hover:border-blue-500 hover:bg-blue-50
                                 transition-all duration-150
                                 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-slate-700 group-hover:text-blue-700">
                          {query.label}
                        </span>
                        {requiresFilters && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                            requires filters
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Filter selection (shown when expanded) */}
                    {isExpanded && requiresBU && (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                        <label className="block">
                          <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                            Select Business Unit
                          </span>
                          <select
                            value={selectedBU}
                            onChange={(e) => setSelectedBU(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md
                                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
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
                            className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-md
                                       hover:bg-blue-700 disabled:bg-slate-300
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
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md
                                       hover:bg-slate-50
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
