/**
 * Scenario Modeling Page - Server Component
 * Fetches baseline metrics and renders scenario interface (conversational or form-based)
 */

import { Suspense } from 'react'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import ScenarioModeSelector from './components/scenario-mode-selector'
import ScenarioLoading from './loading'
import { RefreshButton } from '@/components/ui/refresh-button'

export default async function ScenarioPage() {
  // Fetch baseline metrics server-side
  const baselineResult = await getBaselineMetrics()

  if (!baselineResult.success) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-900">Failed to load baseline metrics</h2>
          <p className="mt-2 text-sm text-red-700">{baselineResult.error.message}</p>
          <p className="mt-4 text-sm text-red-600">
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
      <div className="bg-gradient-to-br from-[var(--secondary)] to-[#1a2332] text-[var(--paper)] px-8 pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-light text-[var(--paper)]">Scenario Modeling</h1>
            <p className="text-[var(--paper)]/80 mt-2">
              Model what-if scenarios with AI-powered conversational analysis or traditional form-based input
            </p>
          </div>
          <RefreshButton label="Refresh Data" />
        </div>
      </div>

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
