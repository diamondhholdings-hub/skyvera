/**
 * Test page for DM Tracker component
 * Standalone page to test the DM% tracking system
 * Gated behind NODE_ENV=development - redirects in production.
 */

import { DMTracker } from '../dashboard/components/dm-tracker'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'

export default function TestDMTrackerPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/dm-strategy')
  }

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: 'linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%)',
        minHeight: '100vh',
        padding: '20px',
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header
          style={{
            background: 'linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%)',
            color: 'white',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '2.8em',
              marginBottom: '10px',
              fontWeight: 700,
            }}
          >
            DM% Tracker Test Page
          </h1>
          <div
            style={{
              fontSize: '1.3em',
              opacity: 0.9,
              marginBottom: '10px',
            }}
          >
            Trailing Twelve Months DM% Tracking &amp; Forecasting System
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '40px' }}>
          <Suspense
            fallback={
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                }}
              >
                Loading DM% data...
              </div>
            }
          >
            <DMTracker />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
