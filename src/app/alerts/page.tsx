/**
 * Alerts Page - Proactive alerts dashboard showing at-risk accounts and anomalies
 * Server Component - fetches alerts directly from alert-data.ts
 * Satisfies requirement DASH-02
 */

import { Suspense } from 'react'
import { getProactiveAlerts } from '@/lib/data/server/alert-data'
import { RefreshButton } from '@/components/ui/refresh-button'
import { AlertSummary } from './components/alert-summary'
import { AlertList } from './components/alert-list'

export const metadata = {
  title: 'Proactive Alerts - Skyvera',
  description: 'At-risk accounts and metric anomalies requiring attention',
}

export default async function AlertsPage() {
  // Fetch proactive alerts
  const alertsResult = await getProactiveAlerts()

  // Handle errors
  if (!alertsResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800">Unable to load alerts</h2>
          <p className="text-sm text-red-600 mt-2">{alertsResult.error.message}</p>
        </div>
      </div>
    )
  }

  const alerts = alertsResult.value

  return (
    <div>
      {/* Editorial Header */}
      <div className="bg-gradient-to-br from-[var(--secondary)] to-[#1a2332] text-[var(--paper)] px-8 pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-light text-[var(--paper)]">Proactive Alerts</h1>
            <p className="text-[var(--paper)]/80 mt-2">At-risk accounts and metric anomalies</p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Alert Summary */}
        <AlertSummary alerts={alerts} />

        {/* Alert Cards */}
        <Suspense fallback={<AlertsSkeleton />}>
          <AlertList alerts={alerts} />
        </Suspense>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for alerts
 */
function AlertsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded shadow-sm border border-[var(--border)] p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-[var(--border)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--border)] rounded w-full"></div>
            <div className="h-4 bg-[var(--border)] rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
