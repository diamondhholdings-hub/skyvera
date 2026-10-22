/**
 * Scenario Modeling Page - Server Component
 * Fetches baseline metrics and renders scenario interface (guided or form-based)
 */

import { Suspense } from 'react'
import { AlertCircle } from 'lucide-react'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import ScenarioModeSelector from './components/scenario-mode-selector'
import { ScenarioLoadingBody } from './loading'
import { RefreshButton } from '@/components/ui/refresh-button'
import { PageHeader } from '@/components/ui/page-header'

export default async function ScenarioPage() {
  // Fetch baseline metrics server-side
  const baselineResult = await getBaselineMetrics()

  if (!baselineResult.success) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        <div className="alert-box alert-critical flex max-w-2xl items-start gap-3" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="m-0 text-base font-semibold">Failed to load baseline metrics</h2>
            <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
              {baselineResult.error.message}
            </p>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--ink-2)' }}>
              Try refreshing the page. If the issue persists, check your data connections.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const baseline = baselineResult.value

  return (
    <div>
      <PageHeader
        title="Scenarios"
        subtitle="Model the effect of pricing, churn, headcount or acquisition changes on revenue and margin"
        action={<RefreshButton label="Refresh data" />}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <Suspense fallback={<ScenarioLoadingBody />}>
          <ScenarioModeSelector baseline={baseline} />
        </Suspense>
      </div>
    </div>
  )
}
