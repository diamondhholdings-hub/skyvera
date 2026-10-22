/**
 * RecentAlertsPreview - Server Component showing top 3 alerts
 * Links to full alerts page (built by Plan 02-03)
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProactiveAlerts } from '@/lib/data/server/alert-data'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { AlertBox } from './alert-box'
import { Panel } from './panel'

export async function RecentAlertsPreview() {
  const result = await getProactiveAlerts()

  if (!result.success) {
    return (
      <Panel title="Recent alerts">
        <AlertBox variant="critical">
          <p className="m-0 font-medium">Unable to load alerts</p>
          <p className="m-0 mt-1 text-sm">{result.error.message}</p>
        </AlertBox>
      </Panel>
    )
  }

  const alerts = result.value.slice(0, 3) // Top 3 only

  if (alerts.length === 0) {
    return (
      <Panel title="Recent alerts">
        <AlertBox variant="success">
          <p className="m-0 font-medium">All metrics within expected ranges</p>
          <p className="m-0 mt-1 text-sm">No alerts at this time</p>
        </AlertBox>
      </Panel>
    )
  }

  return (
    <Panel
      title="Recent alerts"
      action={
        <Link href="/alerts" className="btn btn-sm">
          View all alerts
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
      flush
    >
      <ul className="m-0 list-none p-0">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex items-start gap-3 border-b px-5 py-4 last:border-b-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <HealthIndicator score={alert.severity} />
            <div className="min-w-0 flex-1">
              <h4 className="m-0">{alert.title}</h4>
              {alert.accountName && (
                <p className="m-0 mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
                  Account: {alert.accountName}
                </p>
              )}
              <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>{alert.description}</p>
              <div className="num mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                <span>
                  {alert.metricName}: {alert.currentValue}
                </span>
                <span>Expected: {alert.threshold}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
