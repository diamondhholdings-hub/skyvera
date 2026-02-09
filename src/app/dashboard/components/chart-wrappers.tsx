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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Unable to load revenue trend</p>
          <p className="text-red-600 text-sm mt-1">{result.error.message}</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Margin Comparison by BU</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Unable to load margin data</p>
          <p className="text-red-600 text-sm mt-1">{result.error.message}</p>
        </div>
      </div>
    )
  }

  return <MarginComparison buSummaries={result.value} />
}
