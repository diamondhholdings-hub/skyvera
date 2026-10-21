/**
 * Revenue retention page (DM% strategy)
 * DM% by business unit, recommendations, and projected impact
 *
 * Data comes from the DM tracker snapshot via the type adapter layer.
 */

import { getDMStrategyUIData } from '@/lib/intelligence/dm-strategy/data-provider'
import { getDMTrackerData } from '@/lib/data/server/dm-tracker-data'
import { CircleX } from 'lucide-react'
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
      <div>
        <PageHeader title="Revenue retention" subtitle="DM% by business unit" />
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <div className="alert-box alert-critical flex max-w-2xl items-start gap-3" role="alert">
            <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-sm font-semibold">Unable to load DM strategy data</h2>
              <p className="m-0 mt-1 text-sm">{result.error.message}</p>
              <p className="m-0 mt-1 text-sm">
                This usually means the DM tracker data hasn&apos;t been generated yet. Run the Excel
                extraction script to populate the database with DM% metrics.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/dm-strategy/demo" className="btn btn-sm">View demo page</Link>
                <Link href="/" className="btn btn-ghost btn-sm">Back to dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { businessUnits, dashboardStats, recommendations } = result.value

  // The quarter label comes from the same tracker snapshot the figures do
  // (cached, so this is not a second extraction).
  const tracker = await getDMTrackerData()
  const quarter = tracker.success ? tracker.value.fiscal_quarter : null

  return (
    <div>
      <DMStrategyHero
        stats={dashboardStats}
        quarter={quarter}
        subtitle={`${businessUnits.length} business units · ${quarter ? `${quarter} ` : ''}DM tracker, budget snapshot`}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <PortfolioDashboard
          businessUnits={businessUnits}
          recommendations={recommendations}
        />
      </div>
    </div>
  )
}
