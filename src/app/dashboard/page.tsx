/**
 * Executive Dashboard - Main landing page
 * Server Component with Suspense boundaries for streaming each section independently
 * Calls server data functions directly (no API routes)
 */

import { Suspense } from 'react'
import { KPISection } from './components/kpi-section'
import { BUBreakdown } from './components/bu-breakdown'
import { RevenueChartWrapper, MarginComparisonWrapper } from './components/chart-wrappers'
import { RecentAlertsPreview } from './components/recent-alerts-preview'
import { RefreshButton } from '@/components/ui/refresh-button'

// Skeleton fallbacks for dark theme
function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-white/5 border border-white/10 animate-pulse rounded-[15px]" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-80 bg-white/5 border border-white/10 animate-pulse rounded-[15px]" />
}

function BUSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 bg-white/5 border border-white/10 animate-pulse rounded-[15px]" />
      ))}
    </div>
  )
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-white/5 border border-white/10 animate-pulse rounded-[15px]" />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      {/* Header Section */}
      <div className="px-8 py-12 relative">
        <div className="max-w-[1600px] mx-auto">
          {/* Header with RefreshButton */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#00d4ff]">
                Executive Dashboard
              </h1>
              <p className="text-[#888] text-lg mt-2">
                Real-time business intelligence and performance metrics
              </p>
            </div>
            <RefreshButton label="Refresh Data" />
          </div>

          {/* KPI Section within header */}
          <Suspense fallback={<KPISkeleton />}>
            <KPISection />
          </Suspense>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Charts Section - 2 column grid on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChartWrapper />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <MarginComparisonWrapper />
          </Suspense>
        </div>

        {/* BU Breakdown */}
        <div className="mb-8">
          <Suspense fallback={<BUSkeleton />}>
            <BUBreakdown />
          </Suspense>
        </div>

        {/* Recent Alerts Preview */}
        <div className="mb-8">
          <Suspense fallback={<AlertsSkeleton />}>
            <RecentAlertsPreview />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
