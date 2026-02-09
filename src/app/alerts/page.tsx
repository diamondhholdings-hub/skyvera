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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Proactive Alerts</h1>
          <p className="text-slate-600 mt-2">At-risk accounts and metric anomalies</p>
        </div>
        <RefreshButton />
      </div>

      {/* Alert Summary */}
      <AlertSummary alerts={alerts} />

      {/* Alert Cards */}
      <Suspense fallback={<AlertsSkeleton />}>
        <AlertList alerts={alerts} />
      </Suspense>
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
        <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
