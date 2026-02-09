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

// Skeleton fallbacks matching loading.tsx structure
function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-80 bg-slate-200 animate-pulse rounded-lg" />
}

function BUSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Executive Dashboard</h1>
        <RefreshButton label="Refresh Data" />
      </div>

      {/* KPI Section */}
      <Suspense fallback={<KPISkeleton />}>
        <KPISection />
      </Suspense>

      {/* Charts Section - 2 column grid on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChartWrapper />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <MarginComparisonWrapper />
        </Suspense>
      </div>

      {/* BU Breakdown */}
      <Suspense fallback={<BUSkeleton />}>
        <BUBreakdown />
      </Suspense>

      {/* Recent Alerts Preview */}
      <Suspense fallback={<AlertsSkeleton />}>
        <RecentAlertsPreview />
      </Suspense>
    </div>
  )
}
