/**
 * AlertList - Alerts as a table: leading status icon + word, description,
 * affected account, metric value against its threshold
 * Server Component - renders rows from alert-data.ts
 */

import type { Alert } from '@/lib/data/server/alert-data'
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AlertListProps {
  alerts: Alert[]
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="alert-box alert-success flex items-start gap-3" role="status">
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="m-0 text-sm font-semibold">All metrics within expected ranges</p>
          <p className="m-0 mt-0.5 text-sm">No active alerts at this time.</p>
        </div>
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
    <section className="card overflow-hidden" aria-labelledby="alert-list-heading">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        <h2 id="alert-list-heading" className="m-0 text-base font-semibold">Open alerts</h2>
        <span className="num text-sm" style={{ color: 'var(--muted)' }}>{sortedAlerts.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table" style={{ minWidth: '56rem' }}>
          <thead>
            <tr>
              <th scope="col" style={{ width: '7.5rem' }}>Status</th>
              <th scope="col">Alert</th>
              <th scope="col">Account</th>
              <th scope="col">Metric</th>
              <th scope="col" style={{ textAlign: 'right' }}>Value</th>
              <th scope="col" style={{ textAlign: 'right' }}>Threshold</th>
              <th scope="col" style={{ textAlign: 'right' }}>Raised</th>
            </tr>
          </thead>
          <tbody>
            {sortedAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * Individual alert row
 */
function AlertRow({ alert }: { alert: Alert }) {
  const isCritical = alert.severity === 'red'
  const Icon = isCritical ? CircleX : TriangleAlert
  const color = isCritical ? 'var(--critical-ink)' : 'var(--warning-ink)'

  return (
    <tr style={{ verticalAlign: 'top' }}>
      <td>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color }}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isCritical ? 'Critical' : 'Warning'}
        </span>
      </td>
      <td style={{ maxWidth: '28rem' }}>
        <p className="m-0 text-sm font-medium" style={{ color: 'var(--ink)' }}>{alert.title}</p>
        <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{alert.description}</p>
      </td>
      <td className="text-sm" style={{ color: 'var(--ink)' }}>
        {alert.accountName ?? <span style={{ color: 'var(--muted)' }}>Portfolio</span>}
      </td>
      <td className="text-sm" style={{ color: 'var(--ink-2)' }}>{alert.metricName}</td>
      <td className="num text-sm font-medium" style={{ textAlign: 'right', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
        {alert.currentValue}
      </td>
      <td className="num text-sm" style={{ textAlign: 'right', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        {alert.threshold}
      </td>
      <td className="text-xs" style={{ textAlign: 'right', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
      </td>
    </tr>
  )
}
