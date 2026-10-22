'use client'

/**
 * Impact Calculator - Sticky sidebar
 * Shows projected impact of selected recommendations
 */

import { useState, useMemo } from 'react'
import type { DMRecommendation } from '@/lib/types/dm-strategy'

interface ImpactCalculatorProps {
  recommendations: DMRecommendation[]
  currentDM: number
  targetDM: number
}

export function ImpactCalculator({
  recommendations,
  currentDM,
  targetDM,
}: ImpactCalculatorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const impact = useMemo(() => {
    const selected = recommendations.filter((r) => selectedIds.has(r.id))

    const totalARRImpact = selected.reduce((sum, r) => sum + r.estimatedARRImpact, 0)
    const totalDMImpact = selected.reduce((sum, r) => sum + r.estimatedDMImpact, 0)

    const projectedDM = Math.min(100, currentDM + totalDMImpact)
    const dmGap = targetDM - currentDM
    const dmGapClosure = dmGap > 0 ? (totalDMImpact / dmGap) * 100 : 100

    // Estimate timeframe based on longest recommendation
    let maxTimeframeDays = 30
    for (const rec of selected) {
      if (rec.timeframe.includes('90 days')) maxTimeframeDays = Math.max(maxTimeframeDays, 90)
      else if (rec.timeframe.includes('60 days')) maxTimeframeDays = Math.max(maxTimeframeDays, 60)
      else if (rec.timeframe.includes('30 days')) maxTimeframeDays = Math.max(maxTimeframeDays, 30)
      else if (rec.timeframe.includes('Q')) maxTimeframeDays = Math.max(maxTimeframeDays, 90)
    }

    const estimatedTimeframe =
      maxTimeframeDays <= 30 ? '30 days' : maxTimeframeDays <= 60 ? '60 days' : 'Q2\'26'

    return {
      selectedCount: selected.length,
      totalARRImpact,
      totalDMImpact,
      projectedDM,
      dmGapClosure: Math.min(100, dmGapClosure),
      estimatedTimeframe,
    }
  }, [selectedIds, recommendations, currentDM, targetDM])

  const toggleRecommendation = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectCritical = () => {
    const criticalIds = recommendations.filter((r) => r.priority === 'critical').map((r) => r.id)
    setSelectedIds(new Set(criticalIds))
  }

  const selectAll = () => {
    setSelectedIds(new Set(recommendations.map((r) => r.id)))
  }

  const clearAll = () => {
    setSelectedIds(new Set())
  }

  return (
    <section className="card sticky top-6" aria-labelledby="impact-widget-heading">
      <div className="border-b p-5" style={{ borderColor: 'var(--border)' }}>
        <h2 id="impact-widget-heading" className="m-0 text-base font-semibold">Impact calculator</h2>
        <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>Project outcomes from your action plan</p>
      </div>

      <div className="space-y-5 p-5">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button type="button" onClick={selectCritical} className="btn btn-sm flex-1">Critical only</button>
          <button type="button" onClick={selectAll} className="btn btn-sm flex-1">Select all</button>
          <button type="button" onClick={clearAll} className="btn btn-ghost btn-sm flex-1">Clear</button>
        </div>

        {/* Selection List */}
        <fieldset className="m-0 max-h-64 space-y-1 overflow-y-auto p-2" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <legend className="sr-only">Recommendations to include</legend>
          {recommendations.length === 0 ? (
            <p className="m-0 py-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
              No recommendations available
            </p>
          ) : (
            recommendations.map((rec) => (
              <label
                key={rec.id}
                className="flex cursor-pointer items-start gap-2 p-2 hover:bg-[var(--highlight)]"
                style={{ borderRadius: 'var(--radius-xs)' }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(rec.id)}
                  onChange={() => toggleRecommendation(rec.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{rec.title}</div>
                  <div className="num text-xs" style={{ color: 'var(--muted)' }}>
                    {rec.bu} · ${(rec.estimatedARRImpact / 1e6).toFixed(2)}M ARR
                  </div>
                </div>
              </label>
            ))
          )}
        </fieldset>

        {/* Impact Summary */}
        <dl className="m-0 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <dt className="text-xs" style={{ color: 'var(--muted)' }}>Selected recommendations</dt>
            <dd className="num m-0 text-xl font-semibold">{impact.selectedCount}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: 'var(--muted)' }}>Total ARR impact</dt>
            <dd className="num m-0 text-xl font-semibold">${(impact.totalARRImpact / 1e6).toFixed(2)}M</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: 'var(--muted)' }}>Total DM% improvement</dt>
            <dd className="num m-0 text-xl font-semibold">+{impact.totalDMImpact.toFixed(1)} pts</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: 'var(--muted)' }}>Projected DM%</dt>
            <dd className="m-0 flex items-baseline gap-2">
              <span className="num text-xl font-semibold">{impact.projectedDM.toFixed(1)}%</span>
              {impact.projectedDM >= targetDM && (
                <span className="text-xs font-medium" style={{ color: 'var(--success-ink)' }}>On target</span>
              )}
            </dd>
          </div>

          {currentDM < targetDM && (
            <div>
              <dt className="mb-1 text-xs" style={{ color: 'var(--muted)' }}>Gap closure</dt>
              <dd className="m-0">
                <div className="h-1.5 w-full overflow-hidden" style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-xs)' }}>
                  <div className="h-full" style={{ width: `${Math.min(100, impact.dmGapClosure)}%`, background: 'var(--secondary)' }} />
                </div>
                <div className="num mt-1 text-sm font-medium">{impact.dmGapClosure.toFixed(0)}% of gap</div>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-xs" style={{ color: 'var(--muted)' }}>Estimated timeframe</dt>
            <dd className="m-0 text-sm font-medium">{impact.estimatedTimeframe}</dd>
          </div>
        </dl>

        {/* CTA */}
        {impact.selectedCount > 0 && (
          <button type="button" className="btn btn-primary w-full">
            Export action plan ({impact.selectedCount} items)
          </button>
        )}
      </div>
    </section>
  )
}
