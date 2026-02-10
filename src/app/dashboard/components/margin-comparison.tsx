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
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="bu"
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
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
                fill={entry.meetsTarget ? 'var(--success)' : 'var(--critical)'}
              />
            ))}
          </Bar>
          <Bar
            dataKey="target"
            name="Target Margin"
            fill="var(--secondary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
