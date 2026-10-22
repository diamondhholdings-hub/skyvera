/**
 * Metrics Catalog Component
 * Browseable, searchable catalog of all available business metrics
 */

'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
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
    <div className="card overflow-hidden">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="metric-definitions"
        className="catalog-toggle flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span>
          <span className="block text-sm font-semibold" style={{ color: 'var(--ink)' }}>Metric definitions</span>
          <span className="block text-xs" style={{ color: 'var(--muted)' }}>
            How each figure in an answer is calculated
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--muted)' }}
          aria-hidden="true"
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          id="metric-definitions"
          className="flex max-h-[600px] flex-col gap-3 overflow-y-auto border-t p-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Search input */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--muted)' }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search metrics"
              aria-label="Search metrics"
              className="input pl-9"
            />
          </div>

          {/* Results count */}
          <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}>
            Showing <span className="num">{filteredMetrics.length}</span> of{' '}
            <span className="num">{metricsList.length}</span> metrics
          </p>

          <ul className="m-0 list-none p-0">
            {filteredMetrics.map((metric) => (
              <MetricCard key={metric.name} metric={metric} />
            ))}
          </ul>

          {/* No results */}
          {filteredMetrics.length === 0 && (
            <p className="m-0 py-6 text-sm" style={{ color: 'var(--muted)' }}>
              No metrics match &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
      )}

      <style>{`
        .catalog-toggle { border: 0; background: var(--surface); cursor: pointer; transition: background-color 150ms; }
        .catalog-toggle:hover { background: var(--highlight); }
      `}</style>
    </div>
  )
}

const UNIT_LABELS: Record<SerializableMetricDefinition['unit'], string> = {
  currency: 'Currency',
  percentage: 'Percent',
  count: 'Count',
  ratio: 'Ratio',
}

/**
 * Individual metric definition
 */
function MetricCard({ metric }: { metric: SerializableMetricDefinition }) {
  return (
    <li className="flex flex-col gap-1.5 border-b py-3 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="m-0 text-sm font-semibold" style={{ color: 'var(--ink)' }}>{metric.displayName}</h3>
        <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>{UNIT_LABELS[metric.unit]}</span>
      </div>

      <p className="m-0 text-xs leading-relaxed" style={{ color: 'var(--ink-2)' }}>{metric.description}</p>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        <dt style={{ color: 'var(--muted)' }}>Formula</dt>
        <dd className="m-0" style={{ color: 'var(--ink)' }}>{metric.formula}</dd>
        <dt style={{ color: 'var(--muted)' }}>Source</dt>
        <dd className="m-0" style={{ color: 'var(--ink-2)' }}>{metric.source}</dd>
      </dl>
    </li>
  )
}
