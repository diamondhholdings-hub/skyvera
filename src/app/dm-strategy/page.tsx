/**
 * DM Strategy Page
 * Main page for DM% Strategy Center with recommendations and portfolio overview
 *
 * NOW USING REAL DATA via type adapter layer!
 */

import { getDMStrategyUIData } from '@/lib/intelligence/dm-strategy/data-provider'
import DMStrategyHero from './components/dm-strategy-hero'
import PortfolioDashboard from './components/portfolio-dashboard'
import Link from 'next/link'

export default async function DMStrategyPage() {
  // Fetch real data from backend via adapter layer
  const result = await getDMStrategyUIData()

  // Handle loading error
  if (!result.success) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-[var(--critical)]/30 p-8 max-w-2xl">
          <h2 className="text-2xl font-semibold text-[var(--critical)] mb-4">
            Unable to Load DM Strategy Data
          </h2>
          <p className="text-[var(--ink)] mb-4">
            {result.error.message}
          </p>
          <p className="text-sm text-[var(--muted)] mb-6">
            This usually means the DM tracker data hasn&apos;t been generated yet. Run the Excel
            extraction script to populate the database with DM% metrics.
          </p>
          <div className="flex gap-4">
            <Link
              href="/dm-strategy/demo"
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded"
            >
              View Demo Page
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { businessUnits, dashboardStats, recommendations } = result.value

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero Section */}
      <DMStrategyHero stats={dashboardStats} />

      {/* Link to Trends Page */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link
          href="/dm-strategy/trends"
          className="block bg-gradient-to-r from-[var(--secondary)] to-[#1a2332] text-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                View 12-Month DM% Trend Charts
              </h3>
              <p className="text-sm opacity-90">
                Visualize retention trends with interactive charts for each business unit
              </p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PortfolioDashboard
          businessUnits={businessUnits}
          recommendations={recommendations}
        />
      </div>

      {/* Data Source Indicator */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-[var(--success)]/5 border border-[var(--success)]/30 rounded-lg p-4">
          <p className="text-sm text-[var(--ink)]">
            ✓ <strong>Live Data:</strong> Connected to DM tracker data ({businessUnits.length} business units, {recommendations.length} recommendations)
          </p>
        </div>
      </div>
    </div>
  )
}
