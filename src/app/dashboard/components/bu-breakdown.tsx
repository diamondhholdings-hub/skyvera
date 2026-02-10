/**
 * BUBreakdown - Server Component showing per-BU financial performance
 * Displays revenue, RR/NRR split, margin vs target for each BU
 */

import { getBUSummaries } from '@/lib/data/server/dashboard-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export async function BUBreakdown() {
  const result = await getBUSummaries()

  if (!result.success) {
    return (
      <Card title="Business Unit Breakdown">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Unable to load BU data</p>
          <p className="text-red-600 text-sm mt-1">{result.error.message}</p>
        </div>
      </Card>
    )
  }

  const buSummaries = result.value

  // Filter only main BUs for display
  const mainBUs = buSummaries.filter((bu) =>
    ['Cloudsense', 'Kandy', 'STL'].includes(bu.bu)
  )

  return (
    <Card title="Business Unit Breakdown">
      <div className="space-y-4">
        {mainBUs.map((buSummary) => {
          const rrPercent = buSummary.totalRevenue > 0
            ? (buSummary.totalRR / buSummary.totalRevenue) * 100
            : 0
          const nrrPercent = 100 - rrPercent

          const marginMeetsTarget = buSummary.netMarginPct >= buSummary.netMarginTarget
          const marginColor = marginMeetsTarget ? 'text-[var(--success)]' : 'text-[var(--critical)]'

          return (
            <div
              key={buSummary.bu}
              className="border border-[var(--border)] rounded p-5 hover:border-accent transition-colors"
            >
              {/* BU Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-secondary">
                  {buSummary.bu}
                </h3>
                <Badge variant="default">
                  {buSummary.customerCount} customer{buSummary.customerCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Revenue */}
              <div className="mb-3">
                <p className="text-sm text-muted mb-1">Total Revenue</p>
                <p className="text-2xl font-display font-bold text-ink">
                  ${(buSummary.totalRevenue / 1000000).toFixed(1)}M
                </p>
              </div>

              {/* RR/NRR Split Bar */}
              <div className="mb-3">
                <p className="text-sm text-muted mb-2">Revenue Mix</p>
                <div className="flex h-8 rounded overflow-hidden">
                  <div
                    className="bg-accent flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${rrPercent}%` }}
                  >
                    {rrPercent > 15 && `RR ${rrPercent.toFixed(0)}%`}
                  </div>
                  <div
                    className="bg-secondary flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${nrrPercent}%` }}
                  >
                    {nrrPercent > 15 && `NRR ${nrrPercent.toFixed(0)}%`}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>RR: ${(buSummary.totalRR / 1000000).toFixed(1)}M</span>
                  <span>NRR: ${(buSummary.totalNRR / 1000000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Net Margin */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Net Margin</p>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${marginColor}`}>
                    {buSummary.netMarginPct.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted">
                    (target: {buSummary.netMarginTarget.toFixed(1)}%)
                  </span>
                  {marginMeetsTarget ? (
                    <span className="text-[var(--success)]">✓</span>
                  ) : (
                    <span className="text-[var(--critical)]">✕</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
