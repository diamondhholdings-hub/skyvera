/**
 * DM Strategy Page
 * Main page for DM% Strategy Center with recommendations and portfolio overview
 *
 * NOW USING REAL DATA via type adapter layer!
 */

import { getDMStrategyUIData } from '@/lib/intelligence/dm-strategy/data-provider'
import DMStrategyHero from './components/dm-strategy-hero'
import PortfolioDashboard from './components/portfolio-dashboard'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export default async function DMStrategyPage() {
  // Fetch real data from backend via adapter layer
  const result = await getDMStrategyUIData()

  // Handle loading error
  if (!result.success) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-6">
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(220,38,38,0.25)',
            borderLeft: '4px solid var(--critical)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem 2.5rem',
            maxWidth: '640px',
            width: '100%',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, color: 'var(--critical)', marginBottom: '1rem' }}>
            Unable to Load DM Strategy Data
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>
            {result.error.message}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
            This usually means the DM tracker data hasn&apos;t been generated yet. Run the Excel
            extraction script to populate the database with DM% metrics.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/dm-strategy/demo"
              style={{
                padding: '0.5rem 1.25rem',
                background: 'var(--accent)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
            >
              View Demo Page
            </Link>
            <Link
              href="/"
              style={{
                padding: '0.5rem 1.25rem',
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
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
      <div className="max-w-[1400px] mx-auto px-8 pt-6">
        <Link
          href="/dm-strategy/trends"
          style={{
            display: 'block',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          }}
          className="card-hover"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ink)', margin: 0 }}>
                View 12-Month DM% Trend Charts
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted)', margin: '0.25rem 0 0' }}>
                Visualize retention trends with interactive charts for each business unit
              </p>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 300, flexShrink: 0 }}>→</span>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <PortfolioDashboard
          businessUnits={businessUnits}
          recommendations={recommendations}
        />
      </div>

      {/* Data Source Indicator */}
      <div className="max-w-[1400px] mx-auto px-8 pb-8">
        <div
          style={{
            background: 'rgba(5,150,105,0.04)',
            border: '1px solid rgba(5,150,105,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--ink)', margin: 0 }}>
            ✓ <strong>Live Data:</strong> Connected to DM tracker data ({businessUnits.length} business units, {recommendations.length} recommendations)
          </p>
        </div>
      </div>
    </div>
  )
}
