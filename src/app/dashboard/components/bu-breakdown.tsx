/**
 * BUBreakdown - Server Component showing per-BU financial performance
 * Displays revenue, RR/NRR split, margin vs target for each BU
 */

import { CircleCheck, CircleX } from 'lucide-react'
import { getBUSummaries } from '@/lib/data/server/dashboard-data'
import { AlertBox } from './alert-box'
import { Panel } from './panel'

export async function BUBreakdown() {
  const result = await getBUSummaries()

  if (!result.success) {
    return (
      <Panel title="Business unit breakdown">
        <AlertBox variant="critical">
          <p className="m-0 font-medium">Unable to load BU data</p>
          <p className="m-0 mt-1 text-sm">{result.error.message}</p>
        </AlertBox>
      </Panel>
    )
  }

  const buSummaries = result.value

  // Filter only main BUs for display
  const mainBUs = buSummaries.filter((bu) =>
    ['Cloudsense', 'Kandy', 'STL'].includes(bu.bu)
  )

  return (
    <Panel title="Business unit breakdown" flush>
      <ul className="m-0 list-none p-0">
        {mainBUs.map((buSummary) => {
          const rrPercent = buSummary.totalRevenue > 0
            ? (buSummary.totalRR / buSummary.totalRevenue) * 100
            : 0
          const nrrPercent = 100 - rrPercent

          const marginMeetsTarget = buSummary.netMarginPct >= buSummary.netMarginTarget
          const marginColor = marginMeetsTarget ? 'var(--success-ink)' : 'var(--critical-ink)'
          const MarginIcon = marginMeetsTarget ? CircleCheck : CircleX

          return (
            <li
              key={buSummary.bu}
              className="border-b px-5 py-4 last:border-b-0"
              style={{ borderColor: 'var(--border)' }}
            >
              {/* BU Header */}
              <div className="mb-3 flex items-center justify-between">
                <h4 className="m-0">{buSummary.bu}</h4>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {buSummary.customerCount} customer{buSummary.customerCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Revenue */}
                <div>
                  <p className="m-0 text-[13px]" style={{ color: 'var(--muted)' }}>Total revenue</p>
                  <p className="num m-0 text-xl font-semibold">
                    ${(buSummary.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>

                {/* RR/NRR Split Bar */}
                <div>
                  <p className="m-0 mb-1.5 text-[13px]" style={{ color: 'var(--muted)' }}>Revenue mix</p>
                  <div
                    className="flex h-2 overflow-hidden"
                    style={{ borderRadius: 'var(--radius-xs)', background: 'var(--surface-3)' }}
                    role="img"
                    aria-label={`Recurring ${rrPercent.toFixed(0)}%, non-recurring ${nrrPercent.toFixed(0)}%`}
                  >
                    <div style={{ width: `${rrPercent}%`, background: 'var(--secondary)' }} />
                    <div style={{ width: `${nrrPercent}%`, background: 'var(--accent)' }} />
                  </div>
                  <div className="num mt-1 flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
                    <span>RR ${(buSummary.totalRR / 1000000).toFixed(1)}M</span>
                    <span>NRR ${(buSummary.totalNRR / 1000000).toFixed(1)}M</span>
                  </div>
                </div>

                {/* Net Margin */}
                <div>
                  <p className="m-0 text-[13px]" style={{ color: 'var(--muted)' }}>Net margin</p>
                  <p className="m-0 flex items-center gap-1.5">
                    <MarginIcon className="h-4 w-4" style={{ color: marginColor }} aria-hidden="true" />
                    <span className="num text-xl font-semibold" style={{ color: marginColor }}>
                      {buSummary.netMarginPct.toFixed(1)}%
                    </span>
                    <span className="num text-xs" style={{ color: 'var(--muted)' }}>
                      target {buSummary.netMarginTarget.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
