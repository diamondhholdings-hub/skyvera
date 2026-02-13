/**
 * BUBreakdown - Server Component showing per-BU financial performance
 * Displays revenue, RR/NRR split, margin vs target for each BU
 */

import { getBUSummaries } from '@/lib/data/server/dashboard-data'

export async function BUBreakdown() {
  const result = await getBUSummaries()

  if (!result.success) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
        <h3 className="text-[#00d4ff] text-xl font-bold mb-6 pb-3 border-b border-white/10">
          Business Unit Breakdown
        </h3>
        <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-[8px] p-4">
          <p className="text-[#e74c3c] font-medium">Unable to load BU data</p>
          <p className="text-[#e74c3c]/80 text-sm mt-1">{result.error.message}</p>
        </div>
      </div>
    )
  }

  const buSummaries = result.value

  // Filter only main BUs for display
  const mainBUs = buSummaries.filter((bu) =>
    ['Cloudsense', 'Kandy', 'STL'].includes(bu.bu)
  )

  return (
    <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
      <h3 className="text-[#00d4ff] text-xl font-bold mb-6 pb-3 border-b border-white/10">
        Business Unit Breakdown
      </h3>
      <div className="space-y-4">
        {mainBUs.map((buSummary) => {
          const rrPercent = buSummary.totalRevenue > 0
            ? (buSummary.totalRR / buSummary.totalRevenue) * 100
            : 0
          const nrrPercent = 100 - rrPercent

          const marginMeetsTarget = buSummary.netMarginPct >= buSummary.netMarginTarget
          const marginColor = marginMeetsTarget ? 'text-[#2ecc71]' : 'text-[#e74c3c]'

          return (
            <div
              key={buSummary.bu}
              className="bg-white/5 border border-white/10 rounded-[10px] p-5 card-hover animate-fade-in-up"
            >
              {/* BU Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">
                  {buSummary.bu}
                </h3>
                <span className="px-3 py-1 bg-[#00d4ff]/20 text-[#00d4ff] rounded-full text-sm">
                  {buSummary.customerCount} customer{buSummary.customerCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Revenue */}
              <div className="mb-3">
                <p className="text-sm text-[#aaa] mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-[#00d4ff]">
                  ${(buSummary.totalRevenue / 1000000).toFixed(1)}M
                </p>
              </div>

              {/* RR/NRR Split Bar */}
              <div className="mb-3">
                <p className="text-sm text-[#aaa] mb-2">Revenue Mix</p>
                <div className="flex h-8 rounded-[8px] overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#27ae60] to-[#2ecc71] flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${rrPercent}%` }}
                  >
                    {rrPercent > 15 && `RR ${rrPercent.toFixed(0)}%`}
                  </div>
                  <div
                    className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${nrrPercent}%` }}
                  >
                    {nrrPercent > 15 && `NRR ${nrrPercent.toFixed(0)}%`}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-[#aaa] mt-1">
                  <span>RR: ${(buSummary.totalRR / 1000000).toFixed(1)}M</span>
                  <span>NRR: ${(buSummary.totalNRR / 1000000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Net Margin */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#aaa]">Net Margin</p>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${marginColor}`}>
                    {buSummary.netMarginPct.toFixed(1)}%
                  </span>
                  <span className="text-sm text-[#aaa]">
                    (target: {buSummary.netMarginTarget.toFixed(1)}%)
                  </span>
                  {marginMeetsTarget ? (
                    <span className="text-[#2ecc71]">✓</span>
                  ) : (
                    <span className="text-[#e74c3c]">✕</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
