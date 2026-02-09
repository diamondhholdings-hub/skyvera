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
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #f8fafc, #ffffff, #f8fafc)',
  }

  const contentStyle: React.CSSProperties = {
    padding: '24px',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '30px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#475569',
    marginTop: '4px',
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px',
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Executive Dashboard</h1>
            <p style={subtitleStyle}>
              Real-time business intelligence and performance metrics
            </p>
          </div>
          <RefreshButton label="Refresh Data" />
        </div>

        {/* KPI Section */}
        <div style={sectionStyle}>
          <Suspense fallback={<KPISkeleton />}>
            <KPISection />
          </Suspense>
        </div>

        {/* Charts Section - 2 column grid on large screens */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChartWrapper />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <MarginComparisonWrapper />
          </Suspense>
        </div>

        {/* BU Breakdown */}
        <div style={sectionStyle}>
          <Suspense fallback={<BUSkeleton />}>
            <BUBreakdown />
          </Suspense>
        </div>

        {/* Recent Alerts Preview */}
        <div style={sectionStyle}>
          <Suspense fallback={<AlertsSkeleton />}>
            <RecentAlertsPreview />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
