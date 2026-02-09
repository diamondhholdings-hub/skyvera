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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Unable to load alerts</p>
          <p className="text-red-600 text-sm mt-1">{result.error.message}</p>
        </div>
      </Card>
    )
  }

  const alerts = result.value.slice(0, 3) // Top 3 only

  if (alerts.length === 0) {
    return (
      <Card title="Recent Alerts">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium">All metrics within expected ranges</p>
          <p className="text-green-600 text-sm mt-1">No alerts at this time</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Recent Alerts">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <HealthIndicator score={alert.severity} />
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                {alert.accountName && (
                  <p className="text-sm text-slate-600 mt-1">
                    Account: {alert.accountName}
                  </p>
                )}
                <p className="text-sm text-slate-700 mt-1">{alert.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>
                    {alert.metricName}: {alert.currentValue}
                  </span>
                  <span>Expected: {alert.threshold}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Link to full alerts page */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <Link
          href="/alerts"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View all alerts →
        </Link>
      </div>
    </Card>
  )
}
