/**
 * AlertSummary - Summary statistics for alerts by severity
 * Server Component - displays total and severity counts
 */

import type { Alert } from '@/lib/data/server/alert-data'
import { Badge } from '@/components/ui/badge'

interface AlertSummaryProps {
  alerts: Alert[]
}

export function AlertSummary({ alerts }: AlertSummaryProps) {
  const totalAlerts = alerts.length
  const criticalCount = alerts.filter((a) => a.severity === 'red').length
  const warningCount = alerts.filter((a) => a.severity === 'yellow').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Alerts */}
      <div className="bg-white rounded shadow-sm border border-[var(--border)] p-5">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 flex-shrink-0 text-[var(--accent)]"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Total Alerts</p>
            <p className="text-3xl font-display font-bold text-[var(--ink)]">{totalAlerts}</p>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded shadow-sm border border-[var(--border)] p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--critical)]/10 rounded-full">
            <span className="text-xl text-[var(--critical)]">✕</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Critical</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-display font-bold text-[var(--critical)]">{criticalCount}</p>
              <Badge variant="danger">High Priority</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alerts */}
      <div className="bg-white rounded shadow-sm border border-[var(--border)] p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--warning)]/10 rounded-full">
            <span className="text-xl text-[var(--warning)]">⚠</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Warning</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-display font-bold text-[var(--warning)]">{warningCount}</p>
              <Badge variant="warning">Monitor</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
