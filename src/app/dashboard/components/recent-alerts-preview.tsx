/**
 * RecentAlertsPreview - Server Component showing top 3 alerts
 * Links to full alerts page (built by Plan 02-03)
 */

import Link from 'next/link'
import { getProactiveAlerts } from '@/lib/data/server/alert-data'
import { HealthIndicator } from '@/components/ui/health-indicator'

export async function RecentAlertsPreview() {
  const result = await getProactiveAlerts()

  if (!result.success) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
        <h3 className="text-[#00d4ff] text-lg font-bold mb-6 pb-3 border-b border-white/10">
          Recent Alerts
        </h3>
        <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-[8px] p-4">
          <p className="text-[#e74c3c] font-medium">Unable to load alerts</p>
          <p className="text-[#e74c3c]/80 text-sm mt-1">{result.error.message}</p>
        </div>
      </div>
    )
  }

  const alerts = result.value.slice(0, 3) // Top 3 only

  if (alerts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
        <h3 className="text-[#00d4ff] text-lg font-bold mb-6 pb-3 border-b border-white/10">
          Recent Alerts
        </h3>
        <div className="bg-[#2ecc71]/10 border border-[#2ecc71]/30 rounded-[8px] p-6 text-center">
          <p className="text-[#2ecc71] font-medium">All metrics within expected ranges</p>
          <p className="text-[#2ecc71]/80 text-sm mt-1">No alerts at this time</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
      <h3 className="text-[#00d4ff] text-lg font-bold mb-6 pb-3 border-b border-white/10">
        Recent Alerts
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const borderColor = alert.severity === 'red' ? '#e74c3c' : '#f39c12'
          const bgColor = alert.severity === 'red' ? '#e74c3c' : '#f39c12'

          return (
            <div
              key={alert.id}
              className="border-l-4 rounded-[8px] p-4 transition-colors"
              style={{
                borderLeftColor: borderColor,
                backgroundColor: `${bgColor}10`,
              }}
            >
              <div className="flex items-start gap-3">
                <HealthIndicator score={alert.severity} />
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{alert.title}</h4>
                  {alert.accountName && (
                    <p className="text-sm text-[#aaa] mt-1">
                      Account: {alert.accountName}
                    </p>
                  )}
                  <p className="text-sm text-[#e8e8e8] mt-1">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#aaa]">
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
      <div className="mt-4 pt-4 border-t border-white/10">
        <Link
          href="/alerts"
          className="text-[#00d4ff] hover:text-[#00d4ff]/80 text-sm font-medium"
        >
          View all alerts →
        </Link>
      </div>
    </div>
  )
}
