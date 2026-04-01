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
import { PageHeader } from '@/components/ui/page-header'

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
        <div
          style={{
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderLeft: '4px solid var(--critical)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--critical)', margin: '0 0 0.5rem' }}>
            Unable to load alerts
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
            {alertsResult.error.message}
          </p>
        </div>
      </div>
    )
  }

  const alerts = alertsResult.value

  return (
    <div>
      {/* Editorial Header */}
      <PageHeader
        title="Proactive Alerts"
        subtitle="At-risk accounts and metric anomalies requiring attention"
        action={<RefreshButton />}
      />

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
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
          }}
        >
          <div className="space-y-3">
            <div className="h-5 rounded w-3/4" style={{ background: 'var(--border)' }}></div>
            <div className="h-4 rounded w-full" style={{ background: 'var(--surface-2)' }}></div>
            <div className="h-4 rounded w-2/3" style={{ background: 'var(--surface-2)' }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}
