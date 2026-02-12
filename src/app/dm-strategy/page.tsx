/**
 * DM Strategy Page
 * Main page for DM% Strategy Center with recommendations and portfolio overview
 *
 * NOTE: Currently using demo data. Data layer integration pending type alignment.
 */

'use client'

import DMStrategyHero from './components/dm-strategy-hero'
import PortfolioDashboard from './components/portfolio-dashboard'
import type { DashboardStats, BusinessUnitMetrics, Recommendation } from './types'

// Demo stats - TODO: Replace with real data after type alignment
const demoStats: DashboardStats = {
  currentDM: 8.2,
  potentialARR: 2100000,
  activeRecommendations: 12,
  totalAccounts: 140,
  atRiskAccounts: 8
}

const demoBusinessUnits: BusinessUnitMetrics[] = [
  {
    name: 'Cloudsense',
    currentDM: 7.8,
    targetDM: 7.0,
    trend: 'down',
    trendValue: -0.5,
    arr: 8000000,
    accountCount: 65,
    recommendationCount: 5,
    color: '#0066A1'
  },
  {
    name: 'Kandy',
    currentDM: 9.2,
    targetDM: 8.0,
    trend: 'up',
    trendValue: 0.3,
    arr: 3300000,
    accountCount: 45,
    recommendationCount: 4,
    color: '#00B8D4'
  },
  {
    name: 'STL',
    currentDM: 7.5,
    targetDM: 8.0,
    trend: 'neutral',
    trendValue: 0.0,
    arr: 1000000,
    accountCount: 30,
    recommendationCount: 3,
    color: '#27AE60'
  }
]

const demoRecommendations: Recommendation[] = []

export default function DMStrategyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero Section */}
      <DMStrategyHero stats={demoStats} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Portfolio Overview */}
          <aside className="lg:col-span-1">
            <PortfolioDashboard businessUnits={demoBusinessUnits} recommendations={demoRecommendations} />
          </aside>

          {/* Main Content: Recommendations */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Active Recommendations</h2>
              <p className="text-gray-600 mb-4">
                Recommendation feed with real data integration pending type alignment between data layer and UI components.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> See <code className="bg-blue-100 px-2 py-1 rounded">/dm-strategy/demo</code> for full component showcase with sample recommendations.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
