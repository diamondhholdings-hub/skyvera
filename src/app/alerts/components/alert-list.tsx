/**
 * AlertList - Alert cards with severity indicators, descriptions, affected accounts
 * Server Component - renders alert cards from alert-data.ts
 * Pattern from 02-RESEARCH.md Example 3
 */

import type { Alert } from '@/lib/data/server/alert-data'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { formatDistanceToNow } from 'date-fns'

interface AlertListProps {
  alerts: Alert[]
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-[var(--success)]/10 border border-[var(--success)]/30 rounded p-8 text-center">
        <svg
          className="w-16 h-16 text-[var(--success)] mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-display font-semibold text-[var(--ink)]">All metrics within expected ranges</p>
        <p className="text-sm text-[var(--muted)] mt-2">No active alerts at this time</p>
      </div>
    )
  }

  // Sort: red alerts first, then yellow, within same severity sort by impact
  const sortedAlerts = [...alerts].sort((a, b) => {
    // First sort by severity
    if (a.severity !== b.severity) {
      return a.severity === 'red' ? -1 : 1
    }
    // Then sort by current value impact (higher first if numeric)
    const aValue = typeof a.currentValue === 'number' ? a.currentValue : 0
    const bValue = typeof b.currentValue === 'number' ? b.currentValue : 0
    return bValue - aValue
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sortedAlerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  )
}

/**
 * Individual alert card
 */
function AlertCard({ alert }: { alert: Alert }) {
  const severityColor = alert.severity === 'red' ? 'border-l-[var(--critical)]' : 'border-l-[var(--warning)]'
  const severityBg = alert.severity === 'red' ? 'bg-[var(--critical)]/5' : 'bg-[var(--warning)]/5'

  return (
    <div
      className={`bg-white border border-[var(--border)] rounded shadow-sm p-6 border-l-4 ${severityColor} ${severityBg}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title with health indicator */}
          <div className="flex items-center gap-3 mb-2">
            <HealthIndicator score={alert.severity} label="" />
            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">{alert.title}</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-[var(--muted)] mb-3">{alert.description}</p>

          {/* Account Name */}
          {alert.accountName && (
            <div className="text-sm mb-2">
              <span className="text-[var(--muted)]">Account:</span>{' '}
              <span className="font-medium text-[var(--ink)]">{alert.accountName}</span>
            </div>
          )}

          {/* Metric Details */}
          <div className="text-sm">
            <span className="text-[var(--muted)]">{alert.metricName}:</span>{' '}
            <span className="font-display font-bold text-[var(--ink)]">{alert.currentValue}</span>
            <span className="text-[var(--muted)]"> (threshold: {alert.threshold})</span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-[var(--muted)] ml-4">
          {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}
