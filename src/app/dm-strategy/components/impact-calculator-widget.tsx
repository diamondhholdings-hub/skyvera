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
    <div className="sticky top-6 bg-white rounded-lg border border-[var(--border)] shadow-lg">
      <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-[#0066A1] to-[#0080C8] text-white rounded-t-lg">
        <h2 className="text-xl font-semibold mb-1">Impact Calculator</h2>
        <p className="text-sm opacity-90">Project outcomes from your action plan</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={selectCritical}
            className="flex-1 px-3 py-2 text-xs font-medium bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
          >
            Critical Only
          </button>
          <button
            onClick={selectAll}
            className="flex-1 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-50 text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Selection List */}
        <div className="max-h-64 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-4">
              No recommendations available
            </p>
          ) : (
            recommendations.map((rec) => (
              <label
                key={rec.id}
                className="flex items-start gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(rec.id)}
                  onChange={() => toggleRecommendation(rec.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--ink)] truncate">
                    {rec.title}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {rec.bu} • ${(rec.estimatedARRImpact / 1e6).toFixed(2)}M ARR
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Impact Summary */}
        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Selected Recommendations</div>
            <div className="text-2xl font-bold text-[var(--ink)]">{impact.selectedCount}</div>
          </div>

          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Total ARR Impact</div>
            <div className="text-2xl font-bold text-[var(--success)]">
              ${(impact.totalARRImpact / 1e6).toFixed(2)}M
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Total DM% Improvement</div>
            <div className="text-2xl font-bold text-[#00B8D4]">
              +{impact.totalDMImpact.toFixed(1)}pts
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Projected DM%</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-[var(--ink)]">
                {impact.projectedDM.toFixed(1)}%
              </div>
              {impact.projectedDM >= targetDM && (
                <span className="text-xs font-medium text-[var(--success)]">✓ On Target</span>
              )}
            </div>
          </div>

          {currentDM < targetDM && (
            <div>
              <div className="text-xs text-[var(--muted)] mb-2">Gap Closure</div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#0066A1] to-[#00B8D4] h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, impact.dmGapClosure)}%` }}
                />
              </div>
              <div className="text-sm font-medium text-[var(--ink)] mt-1">
                {impact.dmGapClosure.toFixed(0)}% of gap
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-[var(--muted)] mb-1">Estimated Timeframe</div>
            <div className="text-sm font-semibold text-[var(--ink)]">
              {impact.estimatedTimeframe}
            </div>
          </div>
        </div>

        {/* CTA */}
        {impact.selectedCount > 0 && (
          <button className="w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Export Action Plan ({impact.selectedCount} items)
          </button>
        )}
      </div>
    </div>
  )
}
