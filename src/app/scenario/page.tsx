/**
 * Scenario Modeling Page - Server Component
 * Fetches baseline metrics and renders scenario form
 */

import { Suspense } from 'react'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'
import ScenarioForm from './components/scenario-form'
import ScenarioLoading from './loading'

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Scenario Modeling</h1>
        <p className="text-slate-600">
          Model what-if scenarios and see financial impact with AI-powered analysis
        </p>
      </div>

      {/* Scenario Form */}
      <Suspense fallback={<ScenarioLoading />}>
        <ScenarioForm baseline={baseline} />
      </Suspense>
    </div>
  )
}
