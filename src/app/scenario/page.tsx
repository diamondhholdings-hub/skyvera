/**
 * Scenario Modeling Page - Server Component
 * Fetches baseline metrics and renders scenario interface (conversational or form-based)
 */

import { Suspense } from 'react'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import ScenarioModeSelector from './components/scenario-mode-selector'
import ScenarioLoading from './loading'
import { RefreshButton } from '@/components/ui/refresh-button'
import { PageHeader } from '@/components/ui/page-header'

export default async function ScenarioPage() {
  // Fetch baseline metrics server-side
  const baselineResult = await getBaselineMetrics()

  if (!baselineResult.success) {
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
            Failed to load baseline metrics
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 0.75rem' }}>
            {baselineResult.error.message}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
            Please try refreshing the page. If the issue persists, check your data connections.
          </p>
        </div>
      </div>
    )
  }

  const baseline = baselineResult.value

  return (
    <div>
      {/* Editorial Header */}
      <PageHeader
        title="Scenario Modeling"
        subtitle="Model what-if scenarios with AI-powered conversational analysis or traditional form-based input"
        action={<RefreshButton label="Refresh Data" />}
      />

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Scenario Interface */}
        <Suspense fallback={<ScenarioLoading />}>
          <ScenarioModeSelector baseline={baseline} />
        </Suspense>
      </div>
    </div>
  )
}
