'use client'

/**
 * ImpactDisplay - Before/after metric comparison with Claude analysis
 * Shows accessible change indicators (color + icon + text + aria-label)
 */

import { ArrowUp, ArrowDown, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import type { ImpactMetric, ScenarioImpactResponse } from '@/lib/intelligence/scenarios/types'

interface ImpactDisplayProps {
  calculatedMetrics: ImpactMetric[]
  claudeAnalysis: ScenarioImpactResponse | null
}

export default function ImpactDisplay({ calculatedMetrics, claudeAnalysis }: ImpactDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Metrics Comparison Table */}
      <div className="bg-white rounded shadow-sm border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 bg-[var(--highlight)] border-b border-[var(--border)]">
          <h2 className="text-lg font-display font-semibold text-[var(--secondary)]">Impact Analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--highlight)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Projected
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  % Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {calculatedMetrics.map((metric, index) => {
                const isPositive = metric.change > 0
                const isNegative = metric.change < 0
                const isPercentage = metric.name.includes('%')

                return (
                  <tr key={index} className="hover:bg-[var(--highlight)]/30">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--ink)]">
                      {metric.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink)] text-right">
                      {formatValue(metric.before, isPercentage)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ink)] text-right">
                      {formatValue(metric.after, isPercentage)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-right"
                      aria-label={`${isPositive ? 'Increased' : isNegative ? 'Decreased' : 'Unchanged'} by ${formatValue(Math.abs(metric.change), isPercentage)}`}
                    >
                      <span
                        className={`inline-flex items-center space-x-1 font-display font-semibold ${
                          isPositive ? 'text-[var(--success)]' : isNegative ? 'text-[var(--critical)]' : 'text-[var(--muted)]'
                        }`}
                      >
                        {isPositive && <ArrowUp className="w-4 h-4" />}
                        {isNegative && <ArrowDown className="w-4 h-4" />}
                        <span>{formatValue(Math.abs(metric.change), isPercentage)}</span>
                        <span className="sr-only">
                          {isPositive ? 'increase' : isNegative ? 'decrease' : 'no change'}
                        </span>
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-right"
                      aria-label={`${Math.abs(metric.changePercent).toFixed(1)} percent ${isPositive ? 'increase' : isNegative ? 'decrease' : 'change'}`}
                    >
                      <span
                        className={`font-display font-semibold ${
                          isPositive ? 'text-[var(--success)]' : isNegative ? 'text-[var(--critical)]' : 'text-[var(--muted)]'
                        }`}
                      >
                        {metric.changePercent > 0 ? '+' : ''}
                        {metric.changePercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claude Analysis Section */}
      {claudeAnalysis ? (
        <div className="space-y-4">
          {/* Impact Summary */}
          <div className="bg-[var(--highlight)] border-l-4 border-[var(--accent)] p-6 rounded">
            <h3 className="text-sm font-display font-semibold text-[var(--secondary)] mb-2">Impact Summary</h3>
            <p className="text-sm text-[var(--ink)]">{claudeAnalysis.impactSummary}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded shadow-sm border border-[var(--border)] p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-display font-semibold text-[var(--secondary)]">Recommendation</h3>
                <div className="mt-2 flex items-center space-x-3">
                  {/* Recommendation badge */}
                  <span
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                      claudeAnalysis.recommendation === 'APPROVE'
                        ? 'bg-[var(--success)]/10 text-[var(--success)]'
                        : claudeAnalysis.recommendation === 'APPROVE_WITH_CONDITIONS'
                          ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          : 'bg-[var(--critical)]/10 text-[var(--critical)]'
                    }`}
                  >
                    {claudeAnalysis.recommendation === 'APPROVE' && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {claudeAnalysis.recommendation === 'APPROVE_WITH_CONDITIONS' && (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {claudeAnalysis.recommendation === 'REJECT' && <XCircle className="w-4 h-4" />}
                    <span>{claudeAnalysis.recommendation.replace(/_/g, ' ')}</span>
                  </span>

                  {/* Confidence badge */}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      claudeAnalysis.confidence === 'HIGH'
                        ? 'bg-[var(--success)]/10 text-[var(--success)]'
                        : claudeAnalysis.confidence === 'MEDIUM'
                          ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          : 'bg-[var(--muted)]/10 text-[var(--muted)]'
                    }`}
                  >
                    {claudeAnalysis.confidence} confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--secondary)] mb-2">Reasoning</h4>
              <p className="text-sm text-[var(--ink)]">{claudeAnalysis.reasoning}</p>
            </div>

            {/* Conditions (if any) */}
            {claudeAnalysis.conditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--secondary)] mb-2">Conditions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {claudeAnalysis.conditions.map((condition, index) => (
                    <li key={index} className="text-sm text-[var(--ink)]">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Risks */}
          {claudeAnalysis.risks.length > 0 && (
            <div className="bg-white rounded shadow-sm border border-[var(--border)] p-6">
              <h3 className="text-lg font-display font-semibold text-[var(--secondary)] mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                {claudeAnalysis.risks.map((risk, index) => (
                  <div key={index} className="border-l-4 border-[var(--warning)] pl-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-[var(--ink)]">{risk.description}</p>
                      <div className="flex space-x-2 ml-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.severity === 'HIGH'
                              ? 'bg-[var(--critical)]/10 text-[var(--critical)]'
                              : risk.severity === 'MEDIUM'
                                ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                                : 'bg-[var(--muted)]/10 text-[var(--muted)]'
                          }`}
                        >
                          {risk.severity}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--muted)]/10 text-[var(--muted)]">
                          {risk.likelihood} likelihood
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink)]">
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--highlight)] border border-[var(--border)] rounded-lg p-4">
          <p className="text-sm text-[var(--ink)]">
            <span className="font-medium">Claude analysis unavailable.</span> Configure ANTHROPIC_API_KEY
            for AI-powered impact analysis and recommendations.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Format numeric values for display
 */
function formatValue(value: number, isPercentage: boolean): string {
  if (isPercentage) {
    return `${value.toFixed(1)}%`
  }

  // Currency formatting
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return formatter.format(value)
}
