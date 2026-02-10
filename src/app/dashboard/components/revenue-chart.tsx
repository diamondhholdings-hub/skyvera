/**
 * RevenueChart - Client Component using Recharts for revenue trend visualization
 * Shows actual vs target revenue lines across quarters
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'

interface RevenueTrendPoint {
  quarter: string
  revenue: number
  target: number
}

interface RevenueChartProps {
  data: RevenueTrendPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Format dollar values as $X.XM
  const formatDollar = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`
  }

  return (
    <Card title="Revenue Trend">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="quarter"
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatDollar}
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={(value) => typeof value === 'number' ? formatDollar(value) : value}
            contentStyle={{
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '8px 12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Actual Revenue"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent)', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="var(--secondary)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'var(--secondary)', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
