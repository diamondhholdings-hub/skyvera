/**
 * MarginComparison - Client Component using Recharts for BU margin comparison
 * Shows actual vs target margins as grouped bars with color coding
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { BUFinancialSummary } from '@/lib/types/financial'

interface MarginComparisonProps {
  buSummaries: BUFinancialSummary[]
}

export function MarginComparison({ buSummaries }: MarginComparisonProps) {
  // Transform data for Recharts
  const chartData = buSummaries
    .filter((bu) => ['Cloudsense', 'Kandy', 'STL'].includes(bu.bu))
    .map((bu) => ({
      bu: bu.bu,
      actual: Number(bu.netMarginPct.toFixed(1)),
      target: Number(bu.netMarginTarget.toFixed(1)),
      meetsTarget: bu.netMarginPct >= bu.netMarginTarget,
    }))

  return (
    <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
      <h3 className="text-[#00d4ff] text-lg font-bold mb-6 pb-3 border-b border-white/10">
        Margin Comparison by BU
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="bu"
            stroke="#888"
            style={{ fontSize: '12px', fill: '#888' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#888"
            style={{ fontSize: '12px', fill: '#888' }}
          />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: 'rgba(26, 26, 46, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#e8e8e8',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px', color: '#e8e8e8' }}
          />
          <Bar dataKey="actual" name="Actual Margin" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.meetsTarget ? '#2ecc71' : '#e74c3c'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="target"
            name="Target Margin"
            fill="#f39c12"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
