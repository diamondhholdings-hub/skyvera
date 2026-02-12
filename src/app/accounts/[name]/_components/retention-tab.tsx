/**
 * RetentionTab - DM% Strategy Recommendations and Account Retention
 * Server Component - displays retention strategy, DM risk assessment, and recommendations
 */

import type { RetentionStrategy } from '@/lib/types/account-plan'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RetentionTabProps {
  retentionStrategy: RetentionStrategy
  accountName: string
  arr: number
}

export function RetentionTab({ retentionStrategy, accountName, arr }: RetentionTabProps) {
  const { recommendations, riskLevel, riskScore, riskFactors, healthScore, daysToRenewal } =
    retentionStrategy

  // Risk level color mapping
  const riskColorMap = {
    HIGH: 'bg-red-50 border-red-200 text-red-800',
    MEDIUM: 'bg-orange-50 border-orange-200 text-orange-800',
    LOW: 'bg-green-50 border-green-200 text-green-800',
  }

  const riskBadgeMap = {
    HIGH: 'destructive',
    MEDIUM: 'warning',
    LOW: 'success',
  }

  // Priority color mapping
  const priorityColorMap = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-orange-300 bg-orange-50',
    low: 'border-blue-300 bg-blue-50',
  }

  const priorityBadgeMap = {
    high: 'destructive',
    medium: 'warning',
    low: 'default',
  }

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  // Empty state
  if (recommendations.length === 0 && riskLevel === 'LOW') {
    return (
      <div className="space-y-6">
        {/* Account Health Summary */}
        <div className={`p-6 rounded-lg border-2 ${riskColorMap[riskLevel]}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Account Health Status</h3>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={riskBadgeMap[riskLevel] as any}>
                  {riskLevel} RISK
                </Badge>
                <span className="text-sm font-medium">Health Score: {healthScore}%</span>
                {daysToRenewal !== undefined && (
                  <span className="text-sm font-medium">
                    Renewal in {daysToRenewal} days
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted mb-1">Current ARR</div>
              <div className="text-2xl font-display font-semibold">{formatCurrency(arr)}</div>
            </div>
          </div>
        </div>

        {/* Empty state message */}
        <div className="text-center py-16 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-semibold text-green-900 mb-2">
            No Retention Concerns Identified
          </h3>
          <p className="text-green-700 mb-4">
            This account is performing well with strong health metrics and no immediate risk factors.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-green-800">
            <span className="font-medium">Account Health: {healthScore}%</span>
            <span>•</span>
            <span className="font-medium">DM% Risk: {riskLevel}</span>
            <span>•</span>
            <span className="font-medium">Risk Score: {riskScore}/100</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Account Health Summary Box */}
      <div className={`p-6 rounded-lg border-2 ${riskColorMap[riskLevel]}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">DM% Risk Assessment</h3>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={riskBadgeMap[riskLevel] as any}>
                {riskLevel} RISK
              </Badge>
              <span className="text-sm font-medium">Risk Score: {riskScore}/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted mb-1">Current ARR</div>
            <div className="text-2xl font-display font-semibold">{formatCurrency(arr)}</div>
            <div className="text-sm text-muted mt-1">Health Score: {healthScore}%</div>
          </div>
        </div>

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <h4 className="text-sm font-semibold mb-2">Risk Factors:</h4>
            <ul className="space-y-1">
              {riskFactors.map((factor, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {daysToRenewal !== undefined && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Next Renewal:</span>
              <span className="text-sm">
                {daysToRenewal > 0 ? `${daysToRenewal} days` : 'Overdue'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI-Generated Recommendations Section */}
      {recommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-2xl font-display font-semibold text-secondary mb-2">
              AI-Generated Retention Strategies
            </h3>
            <p className="text-muted">
              Personalized recommendations to improve account health and reduce DM% risk
            </p>
          </div>

          <div className="space-y-4">
            {recommendations
              .filter((rec) => rec.status === 'pending' || rec.status === 'accepted')
              .sort((a, b) => {
                // Sort by priority: high > medium > low
                const priorityOrder = { high: 3, medium: 2, low: 1 }
                return priorityOrder[b.priority] - priorityOrder[a.priority]
              })
              .map((recommendation) => (
                <Card
                  key={recommendation.id}
                  className={`border-2 ${priorityColorMap[recommendation.priority]}`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={priorityBadgeMap[recommendation.priority] as any}>
                            {recommendation.priority.toUpperCase()} PRIORITY
                          </Badge>
                          {recommendation.status === 'accepted' && (
                            <Badge variant="default">Accepted</Badge>
                          )}
                          <span className="text-xs text-muted">
                            {recommendation.confidence}% confidence
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-secondary">
                          {recommendation.title}
                        </h4>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-ink leading-relaxed">
                      {recommendation.description}
                    </p>

                    {/* Impact Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/60 rounded-lg border border-current/20">
                      <div>
                        <div className="text-xs text-muted mb-1">ARR Impact</div>
                        <div className="text-lg font-semibold text-secondary">
                          {recommendation.arrImpact >= 0 ? '+' : ''}
                          {formatCurrency(recommendation.arrImpact)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">DM% Impact</div>
                        <div className="text-lg font-semibold text-secondary">
                          {recommendation.dmImpact >= 0 ? '+' : ''}
                          {recommendation.dmImpact.toFixed(1)}%
                        </div>
                      </div>
                      {recommendation.marginImpact !== undefined && (
                        <div>
                          <div className="text-xs text-muted mb-1">Margin Impact</div>
                          <div className="text-lg font-semibold text-secondary">
                            {recommendation.marginImpact >= 0 ? '+' : ''}
                            {recommendation.marginImpact.toFixed(1)}%
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-muted mb-1">Timeline</div>
                        <div className="text-sm font-medium text-secondary">
                          {recommendation.timeline}
                        </div>
                      </div>
                    </div>

                    {/* Owner and Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-current/20">
                      <div className="text-sm">
                        {recommendation.owner && (
                          <span className="text-muted">
                            Owner: <span className="font-medium text-ink">{recommendation.owner}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {recommendation.status === 'pending' && (
                          <>
                            <button
                              className="px-4 py-2 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent rounded transition-colors"
                              onClick={() => {
                                alert(
                                  'Accept & Create Action feature coming soon!\n\nThis will:\n1. Create an action item in the Action Items tab\n2. Link it to this recommendation\n3. Update recommendation status to "accepted"'
                                )
                              }}
                            >
                              Accept & Create Action
                            </button>
                            <button
                              className="px-4 py-2 text-sm font-medium text-muted bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
                              onClick={() => {
                                alert('Defer recommendation (mark as dismissed)')
                              }}
                            >
                              Defer
                            </button>
                          </>
                        )}
                        {recommendation.status === 'accepted' && (
                          <span className="text-sm text-green-700 font-medium">
                            ✓ Action Created
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Historical Actions Section */}
      {recommendations.some((r) => r.status === 'implemented') && (
        <div className="mt-8">
          <h3 className="text-2xl font-display font-semibold text-secondary mb-4">
            Completed Retention Initiatives
          </h3>
          <div className="space-y-3">
            {recommendations
              .filter((rec) => rec.status === 'implemented')
              .map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-700 font-semibold">✓</span>
                        <h4 className="font-semibold text-green-900">
                          {recommendation.title}
                        </h4>
                      </div>
                      <p className="text-sm text-green-700">{recommendation.description}</p>
                    </div>
                    <div className="text-right text-sm text-green-700">
                      <div className="font-medium">
                        {formatCurrency(recommendation.arrImpact)} ARR Impact
                      </div>
                      {recommendation.implementedAt && (
                        <div className="text-xs mt-1">
                          Completed {new Date(recommendation.implementedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
