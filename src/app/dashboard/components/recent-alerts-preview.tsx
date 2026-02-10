/**
 * RecentAlertsPreview - Server Component showing top 3 alerts
 * Links to full alerts page (built by Plan 02-03)
 */

import Link from 'next/link'
import { getProactiveAlerts } from '@/lib/data/server/alert-data'
import { Card } from '@/components/ui/card'
import { HealthIndicator } from '@/components/ui/health-indicator'

export async function RecentAlertsPreview() {
  const result = await getProactiveAlerts()

  if (!result.success) {
    return (
      <Card title="Recent Alerts">
        <div className="bg-[var(--critical)]/10 border border-[var(--critical)]/30 rounded p-4">
          <p className="text-[var(--critical)] font-medium">Unable to load alerts</p>
          <p className="text-[var(--critical)]/80 text-sm mt-1">{result.error.message}</p>
        </div>
      </Card>
    )
  }

  const alerts = result.value.slice(0, 3) // Top 3 only

  if (alerts.length === 0) {
    return (
      <Card title="Recent Alerts">
        <div className="bg-[var(--success)]/10 border border-[var(--success)]/30 rounded p-6 text-center">
          <p className="text-[var(--success)] font-medium">All metrics within expected ranges</p>
          <p className="text-[var(--success)]/80 text-sm mt-1">No alerts at this time</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Recent Alerts">
      <div className="space-y-3">
        {alerts.map((alert) => {
          const borderColor = alert.severity === 'red' ? 'var(--critical)' : 'var(--warning)'
          const bgColor = alert.severity === 'red' ? 'var(--critical)' : 'var(--warning)'

          return (
            <div
              key={alert.id}
              className="border-l-4 rounded p-4 transition-colors"
              style={{
                borderLeftColor: borderColor,
                backgroundColor: `${bgColor}10`,
              }}
            >
              <div className="flex items-start gap-3">
                <HealthIndicator score={alert.severity} />
                <div className="flex-1">
                  <h4 className="font-semibold text-ink">{alert.title}</h4>
                  {alert.accountName && (
                    <p className="text-sm text-muted mt-1">
                      Account: {alert.accountName}
                    </p>
                  )}
                  <p className="text-sm text-ink mt-1">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                    <span>
                      {alert.metricName}: {alert.currentValue}
                    </span>
                    <span>Expected: {alert.threshold}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Link to full alerts page */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <Link
          href="/alerts"
          className="text-accent hover:text-accent/80 text-sm font-medium"
        >
          View all alerts →
        </Link>
      </div>
    </Card>
  )
}
