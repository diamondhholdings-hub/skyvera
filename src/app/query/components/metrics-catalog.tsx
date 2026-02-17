/**
 * Metrics Catalog Component
 * Browseable, searchable catalog of all available business metrics
 */

'use client'

import { useState, useMemo } from 'react'
import { MetricDefinition } from '@/lib/semantic/schema/financial'

// Serializable metric definition without the calculate function
type SerializableMetricDefinition = Omit<MetricDefinition, 'calculate'>

interface MetricsCatalogProps {
  metrics: Record<string, SerializableMetricDefinition>
}

export function MetricsCatalog({ metrics }: MetricsCatalogProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const metricsList = useMemo(() => Object.values(metrics), [metrics])

  // Filter metrics by search term (debounced in input handler)
  const filteredMetrics = useMemo(() => {
    if (!searchTerm.trim()) return metricsList

    const lower = searchTerm.toLowerCase()
    return metricsList.filter(
      (metric) =>
        metric.displayName.toLowerCase().includes(lower) ||
        metric.name.toLowerCase().includes(lower) ||
        metric.description.toLowerCase().includes(lower)
    )
  }, [metricsList, searchTerm])

  return (
    <div className="border border-[var(--border)] rounded overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-[var(--highlight)] hover:bg-[var(--highlight)]/70
                   flex items-center justify-between
                   transition-colors"
      >
        <h2 className="font-display text-lg font-semibold text-[var(--secondary)]">Browse Metrics Catalog</h2>
        <svg
          className={`w-5 h-5 text-[var(--muted)] transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search metrics..."
              className="w-full px-3 py-2 pl-9 border-2 border-[var(--border)] rounded-md
                         focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                         text-sm"
            />
            <svg
              className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Results count */}
          <p className="text-xs text-[var(--muted)]">
            Showing {filteredMetrics.length} of {metricsList.length} metrics
          </p>

          {/* Metric cards */}
          <div className="space-y-3">
            {filteredMetrics.map((metric) => (
              <MetricCard key={metric.name} metric={metric} />
            ))}
          </div>

          {/* No results */}
          {filteredMetrics.length === 0 && (
            <div className="text-center py-8 text-[var(--muted)]">
              <p className="text-sm">No metrics found matching &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Individual metric card
 */
function MetricCard({ metric }: { metric: SerializableMetricDefinition }) {
  const unitBadgeConfig = {
    currency: { bg: 'bg-[var(--success)]/10', text: 'text-[var(--success)]', label: '$' },
    percentage: { bg: 'bg-[var(--accent)]/10', text: 'text-[var(--accent)]', label: '%' },
    count: { bg: 'bg-[var(--secondary)]/10', text: 'text-[var(--secondary)]', label: '#' },
    ratio: { bg: 'bg-[var(--warning)]/10', text: 'text-[var(--warning)]', label: 'x' },
  }

  const badge = unitBadgeConfig[metric.unit]

  return (
    <div className="p-3 bg-[var(--highlight)]/30 border border-[var(--border)] rounded space-y-2">
      {/* Header with name and unit badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[var(--ink)] text-sm">{metric.displayName}</h3>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text} flex-shrink-0`}
        >
          {badge.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--muted)] leading-relaxed">{metric.description}</p>

      {/* Formula */}
      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted)] mb-1">Formula</p>
        <code className="text-xs bg-[var(--secondary)] text-[var(--paper)] px-2 py-1 rounded font-mono">
          {metric.formula}
        </code>
      </div>

      {/* Source */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
          <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        <span>{metric.source}</span>
      </div>
    </div>
  )
}
