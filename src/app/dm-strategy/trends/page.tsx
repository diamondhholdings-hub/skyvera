/**
 * Retention trends page (Server Component)
 * Fetches live data from getDMStrategyUIData and passes to client renderer
 */

import { getDMStrategyUIData } from '@/lib/intelligence/dm-strategy/data-provider'
import DMTrendsClient from './trends-client'
import Link from 'next/link'
import { CircleX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export default async function DMTrendsPage() {
  const result = await getDMStrategyUIData()

  if (!result.success) {
    return (
      <div>
        <PageHeader title="Retention trends" subtitle="DM% by month for each business unit" />
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <div className="alert-box alert-critical flex max-w-2xl items-start gap-3" role="alert">
            <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-sm font-semibold">Unable to load trend data</h2>
              <p className="m-0 mt-1 text-sm">{result.error.message}</p>
              <Link href="/dm-strategy" className="btn btn-sm mt-3">Back to revenue retention</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <DMTrendsClient businessUnits={result.value.businessUnits} />
}
