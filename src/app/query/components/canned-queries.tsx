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
  performance: 'Performance',
  customers: 'Customers',
  financials: 'Financials',
  comparisons: 'Comparisons',
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
    <section aria-labelledby="suggested-questions-heading" className="flex flex-col gap-3">
      <h2 id="suggested-questions-heading" className="m-0 text-base font-semibold">
        Suggested questions
      </h2>

      {CATEGORY_ORDER.map((category) => {
        const categoryQueries = groupedQueries[category]
        if (categoryQueries.length === 0) return null

        return (
          <div key={category}>
            {/* Category header */}
            <h3 className="section-label m-0 mb-1 mt-1">{CATEGORY_LABELS[category]}</h3>

            <ul className="m-0 -mx-2 list-none p-0">
              {categoryQueries.map((query) => {
                const isExpanded = selectedQueryId === query.id
                const requiresFilters = query.requiredFilters && query.requiredFilters.length > 0
                const requiresBU = query.requiredFilters?.includes('bu')

                return (
                  <li key={query.id}>
                    <button
                      type="button"
                      onClick={() => handleQueryClick(query)}
                      aria-expanded={requiresBU ? isExpanded : undefined}
                      className="suggestion-row flex w-full items-start justify-between gap-2 px-2 py-1.5 text-left text-sm"
                    >
                      <span>{query.label}</span>
                      {requiresFilters && (
                        <span
                          className="badge-warning shrink-0 px-1.5 py-0.5 text-xs font-medium"
                          style={{ borderRadius: 'var(--radius-xs)' }}
                        >
                          Pick a unit
                        </span>
                      )}
                    </button>

                    {/* Filter selection (shown when expanded) */}
                    {isExpanded && requiresBU && (
                      <div
                        className="mx-2 mb-2 mt-1 space-y-3 p-3"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                      >
                        <label className="block">
                          <span className="section-label">Business unit</span>
                          <select
                            value={selectedBU}
                            onChange={(e) => setSelectedBU(e.target.value)}
                            className="input mt-1"
                          >
                            <option value="">Choose a unit</option>
                            {BU_OPTIONS.map((bu) => (
                              <option key={bu} value={bu}>
                                {bu}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleFilterSubmit(query)}
                            disabled={!selectedBU}
                            className="btn btn-sm"
                          >
                            Run
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQueryId(null)
                              setSelectedBU('')
                            }}
                            className="btn btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}

      <style>{`
        .suggestion-row {
          border: 0;
          background: transparent;
          color: var(--ink);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 150ms;
        }
        .suggestion-row:hover { background: var(--highlight); }
      `}</style>
    </section>
  )
}
