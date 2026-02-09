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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Impact Analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Projected
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  % Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calculatedMetrics.map((metric, index) => {
                const isPositive = metric.change > 0
                const isNegative = metric.change < 0
                const isPercentage = metric.name.includes('%')

                return (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {metric.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 text-right">
                      {formatValue(metric.before, isPercentage)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 text-right">
                      {formatValue(metric.after, isPercentage)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-right"
                      aria-label={`${isPositive ? 'Increased' : isNegative ? 'Decreased' : 'Unchanged'} by ${formatValue(Math.abs(metric.change), isPercentage)}`}
                    >
                      <span
                        className={`inline-flex items-center space-x-1 ${
                          isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-slate-500'
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
                        className={
                          isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-slate-500'
                        }
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Impact Summary</h3>
            <p className="text-sm text-blue-800">{claudeAnalysis.impactSummary}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recommendation</h3>
                <div className="mt-2 flex items-center space-x-3">
                  {/* Recommendation badge */}
                  <span
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                      claudeAnalysis.recommendation === 'APPROVE'
                        ? 'bg-green-100 text-green-800'
                        : claudeAnalysis.recommendation === 'APPROVE_WITH_CONDITIONS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
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
                        ? 'bg-green-100 text-green-700'
                        : claudeAnalysis.confidence === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {claudeAnalysis.confidence} confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Reasoning</h4>
              <p className="text-sm text-slate-600">{claudeAnalysis.reasoning}</p>
            </div>

            {/* Conditions (if any) */}
            {claudeAnalysis.conditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Conditions</h4>
                <ul className="list-disc list-inside space-y-1">
                  {claudeAnalysis.conditions.map((condition, index) => (
                    <li key={index} className="text-sm text-slate-600">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Risks */}
          {claudeAnalysis.risks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                {claudeAnalysis.risks.map((risk, index) => (
                  <div key={index} className="border-l-4 border-orange-400 pl-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-slate-900">{risk.description}</p>
                      <div className="flex space-x-2 ml-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            risk.severity === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : risk.severity === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {risk.severity}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {risk.likelihood} likelihood
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600">
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
