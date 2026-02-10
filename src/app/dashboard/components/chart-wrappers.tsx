/**
 * Chart wrapper components - Server Components that fetch data and pass to client chart components
 * This pattern keeps all data fetching server-side per 02-RESEARCH.md
 */

import { getRevenueTrendData, getBUSummaries } from '@/lib/data/server/dashboard-data'
import { RevenueChart } from './revenue-chart'
import { MarginComparison } from './margin-comparison'

/**
 * Server wrapper for RevenueChart
 * Fetches trend data server-side and passes as props to client component
 */
export async function RevenueChartWrapper() {
  const result = await getRevenueTrendData()

  if (!result.success) {
    return (
      <div className="bg-paper rounded border border-[var(--border)] p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-secondary mb-4">Revenue Trend</h2>
        <div className="bg-[var(--critical)]/10 border border-[var(--critical)]/30 rounded p-4">
          <p className="text-[var(--critical)] font-medium">Unable to load revenue trend</p>
          <p className="text-[var(--critical)]/80 text-sm mt-1">{result.error.message}</p>
        </div>
      </div>
    )
  }

  return <RevenueChart data={result.value} />
}

/**
 * Server wrapper for MarginComparison
 * Fetches BU summaries server-side and passes as props to client component
 */
export async function MarginComparisonWrapper() {
  const result = await getBUSummaries()

  if (!result.success) {
    return (
      <div className="bg-paper rounded border border-[var(--border)] p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-secondary mb-4">Margin Comparison by BU</h2>
        <div className="bg-[var(--critical)]/10 border border-[var(--critical)]/30 rounded p-4">
          <p className="text-[var(--critical)] font-medium">Unable to load margin data</p>
          <p className="text-[var(--critical)]/80 text-sm mt-1">{result.error.message}</p>
        </div>
      </div>
    )
  }

  return <MarginComparison buSummaries={result.value} />
}
