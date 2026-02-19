/**
 * StrategyTab - Pain points and opportunities with status tracking
 * Server Component - receives pain points and opportunities as props
 * Includes Pain Point Analysis table view + card grid (WCAG compliant)
 */

import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { Badge } from '@/components/ui/badge'

interface StrategyTabProps {
  painPoints: PainPoint[]
  opportunities: Opportunity[]
}

export function StrategyTab({ painPoints, opportunities }: StrategyTabProps) {
  return (
    <div className="space-y-8">
      {/* W1-P1-007: Pain Point Analysis table */}
      <div>
        <h2 className="font-display text-xl font-semibold text-secondary mb-4">Pain Point Analysis</h2>
        {painPoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr className="bg-[var(--secondary)] text-[var(--paper)]">
                  <th className="p-4 text-left font-medium">Pain Point</th>
                  <th className="p-4 text-left font-medium">Urgency</th>
                  <th className="p-4 text-left font-medium">CloudSense Solution</th>
                </tr>
              </thead>
              <tbody>
                {painPoints.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-[var(--paper)]' : 'bg-[var(--highlight)]'}>
                    <td className="p-4 text-[var(--ink)] font-medium">{p.title}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          p.severity === 'high'
                            ? 'bg-[var(--critical)]/10 text-[var(--critical)]'
                            : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                        }`}
                      >
                        {p.severity}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted)]">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[var(--highlight)] border border-[var(--border)] rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-[var(--muted)] font-medium">No pain points tracked yet</p>
            <p className="text-sm text-[var(--muted)] mt-1">
              Pain points will appear here as they are identified
            </p>
          </div>
        )}
      </div>

      {/* Two-column card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pain Points Column */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-xl font-semibold text-secondary">Pain Points</h2>
            <Badge variant="default">{painPoints.length}</Badge>
          </div>

          {painPoints.length > 0 ? (
            <div className="space-y-4">
              {painPoints.map((painPoint) => (
                <PainPointCard key={painPoint.id} painPoint={painPoint} />
              ))}
            </div>
          ) : (
            <div className="bg-[var(--highlight)] border border-[var(--border)] rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-[var(--muted)] font-medium">No pain points tracked yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Pain points will appear here as they are identified
              </p>
            </div>
          )}
        </div>

        {/* Opportunities Column */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-xl font-semibold text-secondary">Opportunities</h2>
            <Badge variant="default">{opportunities.length}</Badge>
          </div>

          {opportunities.length > 0 ? (
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          ) : (
            <div className="bg-[var(--highlight)] border border-[var(--border)] rounded-lg p-8 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-[var(--muted)] font-medium">No opportunities identified yet</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                Opportunities will appear here as they are discovered
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Pain Point Card with severity and status badges (WCAG: color + icon)
 */
function PainPointCard({ painPoint }: { painPoint: PainPoint }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* W1-P3-003: font-display on h3 */}
        <h3 className="font-display font-semibold text-ink">{painPoint.title}</h3>
        <SeverityBadge severity={painPoint.severity} />
      </div>

      <p className="text-sm text-muted mb-3">{painPoint.description}</p>

      <div className="flex items-center gap-2">
        <StatusBadge status={painPoint.status} />
        {painPoint.owner && (
          <span className="text-xs text-muted">Owner: {painPoint.owner}</span>
        )}
      </div>
    </div>
  )
}

/**
 * Opportunity Card with status badge and estimated value
 */
function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const formatValue = (value: number): string => {
    return `$${(value / 1000).toFixed(0)}K`
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* W1-P3-003: font-display on h3 */}
        <h3 className="font-display font-semibold text-ink">{opportunity.title}</h3>
        <OpportunityStatusBadge status={opportunity.status} />
      </div>

      <p className="text-sm text-muted mb-3">{opportunity.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {opportunity.estimatedValue && (
            <span className="font-display font-semibold text-[#2e7d32]">
              {formatValue(opportunity.estimatedValue)}
            </span>
          )}
          {opportunity.probability !== undefined && (
            <span className="text-muted">{opportunity.probability}% probability</span>
          )}
        </div>
        {opportunity.owner && (
          <span className="text-xs text-muted">Owner: {opportunity.owner}</span>
        )}
      </div>
    </div>
  )
}

/**
 * Severity Badge (WCAG: color + icon + text)
 */
function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { variant: 'danger' as const, icon: '🔴', label: 'High' },
    medium: { variant: 'warning' as const, icon: '🟡', label: 'Medium' },
    low: { variant: 'success' as const, icon: '🟢', label: 'Low' },
  }

  const { variant, icon, label } = config[severity]

  return (
    <Badge variant={variant}>
      <span className="inline-flex items-center gap-1">
        {icon} {label}
      </span>
    </Badge>
  )
}

/**
 * Pain Point Status Badge (WCAG: color + icon + text)
 */
function StatusBadge({ status }: { status: 'active' | 'monitoring' | 'resolved' }) {
  const config = {
    active: { variant: 'danger' as const, icon: '●', label: 'Active', color: 'text-red-600' },
    monitoring: {
      variant: 'warning' as const,
      icon: '◐',
      label: 'Monitoring',
      color: 'text-amber-600',
    },
    resolved: {
      variant: 'success' as const,
      icon: '✓',
      label: 'Resolved',
      color: 'text-green-600',
    },
  }

  const badgeConfig = config[status]

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${badgeConfig.color}`}>
      {badgeConfig.icon} {badgeConfig.label}
    </span>
  )
}

/**
 * Opportunity Status Badge (WCAG: color + icon + text)
 */
function OpportunityStatusBadge({
  status,
}: {
  status: 'identified' | 'exploring' | 'proposed' | 'won' | 'lost'
}) {
  const config = {
    identified: { variant: 'default' as const, icon: '🔍', label: 'Identified' },
    exploring: { variant: 'default' as const, icon: '🔬', label: 'Exploring' },
    proposed: { variant: 'warning' as const, icon: '📋', label: 'Proposed' },
    won: { variant: 'success' as const, icon: '✓', label: 'Won' },
    lost: { variant: 'danger' as const, icon: '✕', label: 'Lost' },
  }

  const { variant, icon, label } = config[status]

  return (
    <Badge variant={variant}>
      <span className="inline-flex items-center gap-1">
        {icon} {label}
      </span>
    </Badge>
  )
}
