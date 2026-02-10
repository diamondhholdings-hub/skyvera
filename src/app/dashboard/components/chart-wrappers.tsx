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
      <div className="bg-white/5 rounded-[15px] border border-white/10 p-6">
        <h2 className="text-[#00d4ff] text-lg font-bold mb-4">Revenue Trend</h2>
        <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-[8px] p-4">
          <p className="text-[#e74c3c] font-medium">Unable to load revenue trend</p>
          <p className="text-[#e74c3c]/80 text-sm mt-1">{result.error.message}</p>
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
      <div className="bg-white/5 rounded-[15px] border border-white/10 p-6">
        <h2 className="text-[#00d4ff] text-lg font-bold mb-4">Margin Comparison by BU</h2>
        <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-[8px] p-4">
          <p className="text-[#e74c3c] font-medium">Unable to load margin data</p>
          <p className="text-[#e74c3c]/80 text-sm mt-1">{result.error.message}</p>
        </div>
      </div>
    )
  }

  return <MarginComparison buSummaries={result.value} />
}
