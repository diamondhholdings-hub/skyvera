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
import { Card } from '@/components/ui/card'
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
    <Card title="Margin Comparison by BU">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="bu"
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Bar dataKey="actual" name="Actual Margin" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.meetsTarget ? '#22c55e' : '#ef4444'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="target"
            name="Target Margin"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
