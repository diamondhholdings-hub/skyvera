/**
 * Natural Language Query Page (Server Component)
 * Loads data sources and renders client-side query interface
 */

import { CANNED_QUERIES } from '@/lib/intelligence/nlq/canned-queries'
import { METRIC_DEFINITIONS } from '@/lib/semantic/schema/financial'
import { QueryPageClient } from './components/query-page-client'

export default function QueryPage() {
  // Server Component - fetch any server-side data here if needed
  // Strip out the calculate functions from metrics (can't serialize to client)
  const serializableMetrics = Object.fromEntries(
    Object.entries(METRIC_DEFINITIONS).map(([key, metric]) => {
      const { calculate, ...rest } = metric
      return [key, rest]
    })
  )

  return (
    <QueryPageClient cannedQueries={CANNED_QUERIES} metrics={serializableMetrics} />
  )
}
