/**
 * BU Performance Table
 * Displays business unit financial performance with progress bars
 */

import type { BUFinancialSummary } from '@/lib/types/financial'

interface BUPerformanceTableProps {
  buSummaries: BUFinancialSummary[]
}

export function BUPerformanceTable({ buSummaries }: BUPerformanceTableProps) {
  return (
    <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm my-5">
      <thead>
        <tr className="bg-[#1e3c72] text-white text-left">
          <th className="p-4 font-semibold text-sm">Business Unit</th>
          <th className="p-4 font-semibold text-sm">Revenue</th>
          <th className="p-4 font-semibold text-sm">Customers</th>
          <th className="p-4 font-semibold text-sm">Net Margin</th>
          <th className="p-4 font-semibold text-sm">Target</th>
          <th className="p-4 font-semibold text-sm">Delta</th>
          <th className="p-4 font-semibold text-sm">% of Target</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {buSummaries.map((bu) => {
          const delta = bu.ebitda - (bu.totalRevenue * bu.netMarginTarget) / 100
          const percentOfTarget = (bu.netMarginPct / bu.netMarginTarget) * 100

          return (
            <tr key={bu.bu} className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 text-sm font-semibold">{bu.bu}</td>
              <td className="p-3 text-sm">${(bu.totalRevenue / 1e6).toFixed(2)}M</td>
              <td className="p-3 text-sm">{bu.customerCount}</td>
              <td className="p-3 text-sm">
                <span
                  className={`font-semibold ${bu.netMarginPct >= bu.netMarginTarget ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {bu.netMarginPct.toFixed(1)}%
                </span>
              </td>
              <td className="p-3 text-sm">{bu.netMarginTarget.toFixed(1)}%</td>
              <td className="p-3 text-sm">
                <span
                  className={`inline-block px-3 py-1 rounded-2xl text-white text-xs font-semibold ${delta < 0 ? 'bg-[#f5576c]' : 'bg-[#4facfe]'}`}
                >
                  {delta < 0 ? '-' : '+'}${Math.abs(delta / 1e3).toFixed(0)}K
                </span>
              </td>
              <td className="p-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${percentOfTarget >= 90 ? 'bg-[#fee140]' : 'bg-[#f5576c]'}`}
                      style={{ width: `${Math.min(percentOfTarget, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{percentOfTarget.toFixed(0)}%</span>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
