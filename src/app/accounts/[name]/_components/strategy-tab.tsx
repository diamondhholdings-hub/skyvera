/**
 * StrategyTab - Pain points and opportunities with status tracking
 * Server Component - receives pain points and opportunities as props
 * Two-column responsive grid with color-coded status badges (WCAG compliant)
 */

import type { PainPoint, Opportunity } from '@/lib/types/account-plan'
import { Badge } from '@/components/ui/badge'

interface StrategyTabProps {
  painPoints: PainPoint[]
  opportunities: Opportunity[]
}

export function StrategyTab({ painPoints, opportunities }: StrategyTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pain Points Column */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Pain Points</h2>
          <Badge variant="default">{painPoints.length}</Badge>
        </div>

        {painPoints.length > 0 ? (
          <div className="space-y-4">
            {painPoints.map((painPoint) => (
              <PainPointCard key={painPoint.id} painPoint={painPoint} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-slate-600 font-medium">No pain points tracked yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Pain points will appear here as they are identified
            </p>
          </div>
        )}
      </div>

      {/* Opportunities Column */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Opportunities</h2>
          <Badge variant="default">{opportunities.length}</Badge>
        </div>

        {opportunities.length > 0 ? (
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-slate-600 font-medium">No opportunities identified yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Opportunities will appear here as they are discovered
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Pain Point Card with severity and status badges (WCAG: color + icon)
 */
function PainPointCard({ painPoint }: { painPoint: PainPoint }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-900">{painPoint.title}</h3>
        <SeverityBadge severity={painPoint.severity} />
      </div>

      <p className="text-sm text-slate-600 mb-3">{painPoint.description}</p>

      <div className="flex items-center gap-2">
        <StatusBadge status={painPoint.status} />
        {painPoint.owner && (
          <span className="text-xs text-slate-500">Owner: {painPoint.owner}</span>
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
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-900">{opportunity.title}</h3>
        <OpportunityStatusBadge status={opportunity.status} />
      </div>

      <p className="text-sm text-slate-600 mb-3">{opportunity.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {opportunity.estimatedValue && (
            <span className="font-medium text-green-700">
              {formatValue(opportunity.estimatedValue)}
            </span>
          )}
          {opportunity.probability !== undefined && (
            <span className="text-slate-600">{opportunity.probability}% probability</span>
          )}
        </div>
        {opportunity.owner && (
          <span className="text-xs text-slate-500">Owner: {opportunity.owner}</span>
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
