/**
 * Test page for DM Tracker component
 * Standalone page to test the DM% tracking system
 * Gated behind NODE_ENV=development - redirects in production.
 */

import { DMTracker } from '../dashboard/components/dm-tracker'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'

export default function TestDMTrackerPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/dm-strategy')
  }

  return (
    <div>
      <PageHeader
        title="DM% tracker test page"
        subtitle="Trailing twelve months DM% tracking and forecast · development only"
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <Suspense
          fallback={
            <div className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              Loading DM% data...
            </div>
          }
        >
          <DMTracker />
        </Suspense>
      </div>
    </div>
  )
}
