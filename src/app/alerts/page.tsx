/**
 * Alerts Page - Alerts dashboard showing at-risk accounts and anomalies
 * Server Component - fetches alerts directly from alert-data.ts
 * Satisfies requirement DASH-02
 */

import { Suspense } from 'react'
import { CircleX } from 'lucide-react'
import { getProactiveAlerts } from '@/lib/data/server/alert-data'
import { RefreshButton } from '@/components/ui/refresh-button'
import { AlertSummary } from './components/alert-summary'
import { AlertList } from './components/alert-list'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Alerts - Skyvera',
  description: 'At-risk accounts and metric anomalies requiring attention',
}

export default async function AlertsPage() {
  // Fetch proactive alerts
  const alertsResult = await getProactiveAlerts()

  // Handle errors
  if (!alertsResult.success) {
    return (
      <div>
        <PageHeader title="Alerts" subtitle="At-risk accounts and metric anomalies" />
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <div className="alert-box alert-critical flex items-start gap-3" role="alert">
            <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-sm font-semibold">Unable to load alerts</h2>
              <p className="m-0 mt-0.5 text-sm">{alertsResult.error.message}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const alerts = alertsResult.value

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="At-risk accounts and metric anomalies that cross a threshold"
        action={<RefreshButton />}
      >
        <AlertSummary alerts={alerts} />
      </PageHeader>

      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
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
    <div className="card p-5">
      <div className="skeleton mb-4 h-5 w-32" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
