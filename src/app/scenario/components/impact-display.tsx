'use client'

/**
 * ImpactDisplay - Before/after metric comparison with written analysis
 * Shows accessible change indicators (color + icon + text + aria-label)
 */

import { ArrowUp, ArrowDown, CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { ImpactMetric, ScenarioImpactResponse } from '@/lib/intelligence/scenarios/types'
import { KpiStrip } from '@/components/ui/kpi-strip'
import { Badge } from '@/components/ui/badge'

interface ImpactDisplayProps {
  calculatedMetrics: ImpactMetric[]
  claudeAnalysis: ScenarioImpactResponse | null
}

type Level = 'HIGH' | 'MEDIUM' | 'LOW'

const levelVariant = (level: Level, high: 'danger' | 'success') =>
  level === 'HIGH' ? high : level === 'MEDIUM' ? ('warning' as const) : ('default' as const)

const sentence = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')

export default function ImpactDisplay({ calculatedMetrics, claudeAnalysis }: ImpactDisplayProps) {
  const headline = calculatedMetrics.slice(0, 4).map((metric) => {
    const isPercentage = metric.name.includes('%')
    return {
      label: metric.name,
      value: formatValue(metric.after, isPercentage),
      context: `${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(1)}% vs ${formatValue(metric.before, isPercentage)} today`,
    }
  })

  return (
    <div className="space-y-6">
      <section aria-labelledby="impact-heading" className="flex flex-col gap-3">
        <h2 id="impact-heading" className="m-0 text-lg font-semibold">Projected impact</h2>
        {headline.length > 0 && <KpiStrip items={headline} />}

        {/* Metrics Comparison Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Current</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Projected</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Change</th>
                  <th scope="col" style={{ textAlign: 'right' }}>% change</th>
                </tr>
              </thead>
              <tbody>
                {calculatedMetrics.map((metric, index) => {
                  const isPositive = metric.change > 0
                  const isNegative = metric.change < 0
                  const isPercentage = metric.name.includes('%')
                  const changeColor = isPositive
                    ? 'var(--success-ink)'
                    : isNegative
                      ? 'var(--critical-ink)'
                      : 'var(--muted)'

                  return (
                    <tr key={index}>
                      <td className="font-medium">{metric.name}</td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {formatValue(metric.before, isPercentage)}
                      </td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {formatValue(metric.after, isPercentage)}
                      </td>
                      <td
                        style={{ textAlign: 'right' }}
                        aria-label={`${isPositive ? 'Increased' : isNegative ? 'Decreased' : 'Unchanged'} by ${formatValue(Math.abs(metric.change), isPercentage)}`}
                      >
                        <span className="num inline-flex items-center gap-1 font-medium" style={{ color: changeColor }}>
                          {isPositive && <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />}
                          {isNegative && <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />}
                          <span>{formatValue(Math.abs(metric.change), isPercentage)}</span>
                          <span className="sr-only">
                            {isPositive ? 'increase' : isNegative ? 'decrease' : 'no change'}
                          </span>
                        </span>
                      </td>
                      <td
                        style={{ textAlign: 'right' }}
                        aria-label={`${Math.abs(metric.changePercent).toFixed(1)} percent ${isPositive ? 'increase' : isNegative ? 'decrease' : 'change'}`}
                      >
                        <span className="num font-medium" style={{ color: changeColor }}>
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
      </section>

      {/* Written analysis */}
      {claudeAnalysis ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Summary + recommendation */}
          <section className="card space-y-4 p-5" aria-labelledby="recommendation-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="recommendation-heading" className="m-0 text-base font-semibold">Recommendation</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    claudeAnalysis.recommendation === 'APPROVE'
                      ? 'success'
                      : claudeAnalysis.recommendation === 'APPROVE_WITH_CONDITIONS'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {claudeAnalysis.recommendation === 'APPROVE' && <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                  {claudeAnalysis.recommendation === 'APPROVE_WITH_CONDITIONS' && (
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {claudeAnalysis.recommendation === 'REJECT' && <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                  {sentence(claudeAnalysis.recommendation)}
                </Badge>
                <Badge variant={levelVariant(claudeAnalysis.confidence as Level, 'success')}>
                  {sentence(claudeAnalysis.confidence)} confidence
                </Badge>
              </div>
            </div>

            <div>
              <p className="section-label m-0 mb-1">Summary</p>
              <p className="m-0 text-sm" style={{ color: 'var(--ink)' }}>{claudeAnalysis.impactSummary}</p>
            </div>

            <div>
              <p className="section-label m-0 mb-1">Reasoning</p>
              <p className="m-0 text-sm" style={{ color: 'var(--ink)' }}>{claudeAnalysis.reasoning}</p>
            </div>

            {claudeAnalysis.conditions.length > 0 && (
              <div>
                <p className="section-label m-0 mb-1">Conditions</p>
                <ul className="m-0 list-disc space-y-1 pl-5">
                  {claudeAnalysis.conditions.map((condition, index) => (
                    <li key={index} className="text-sm" style={{ color: 'var(--ink)' }}>
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Risks */}
          {claudeAnalysis.risks.length > 0 && (
            <section className="card overflow-hidden" aria-labelledby="risks-heading">
              <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                <h3 id="risks-heading" className="m-0 text-base font-semibold">Risks</h3>
              </div>
              <ul className="m-0 list-none p-0">
                {claudeAnalysis.risks.map((risk, index) => (
                  <li
                    key={index}
                    className="flex flex-col gap-1 border-b px-5 py-3 last:border-b-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="m-0 min-w-0 flex-1 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {risk.description}
                      </p>
                      <div className="flex shrink-0 gap-1.5">
                        <Badge variant={levelVariant(risk.severity as Level, 'danger')}>
                          {sentence(risk.severity)} severity
                        </Badge>
                        <Badge>{sentence(risk.likelihood)} likelihood</Badge>
                      </div>
                    </div>
                    <p className="m-0 text-sm" style={{ color: 'var(--ink-2)' }}>
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="alert-box alert-warning m-0 flex items-start gap-3" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="m-0 text-sm">
            <span className="font-medium">Recommendation and risk review are unavailable right now.</span>{' '}
            <span style={{ color: 'var(--ink-2)' }}>
              The figures above are calculated directly from the budget and are not affected.
            </span>
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
