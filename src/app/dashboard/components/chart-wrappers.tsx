/**
 * Chart wrapper components - Server Components that fetch data and pass to client chart components
 * This pattern keeps all data fetching server-side per 02-RESEARCH.md
 */

import { getRevenueTrendData, getBUSummaries } from '@/lib/data/server/dashboard-data'
import { RevenueChart } from './revenue-chart'
import { MarginComparison } from './margin-comparison'
import { AlertBox } from './alert-box'
import { Panel } from './panel'

/**
 * Server wrapper for RevenueChart
 * Fetches trend data server-side and passes as props to client component
 */
export async function RevenueChartWrapper() {
  const result = await getRevenueTrendData()

  if (!result.success) {
    return (
      <Panel title="Revenue trend">
        <AlertBox variant="critical">
          <p className="m-0 font-medium">Unable to load revenue trend</p>
          <p className="m-0 mt-1 text-sm">{result.error.message}</p>
        </AlertBox>
      </Panel>
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
      <Panel title="Margin by business unit">
        <AlertBox variant="critical">
          <p className="m-0 font-medium">Unable to load margin data</p>
          <p className="m-0 mt-1 text-sm">{result.error.message}</p>
        </AlertBox>
      </Panel>
    )
  }

  return <MarginComparison buSummaries={result.value} />
}
