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
import { CHART_VARS, TOOLTIP_STYLE } from '@/components/charts/chart-colors'

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

  const tick = { fontSize: 11, fill: CHART_VARS.axis }

  return (
    <div className="card p-5">
      <h3 className="m-0 mb-4">Revenue trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke={CHART_VARS.grid} vertical={false} />
          <XAxis dataKey="quarter" tick={tick} axisLine={{ stroke: CHART_VARS.grid }} tickLine={false} />
          <YAxis tickFormatter={formatDollar} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => typeof value === 'number' ? formatDollar(value) : value}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--ink-2)' }} iconType="plainline" />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Actual revenue"
            stroke={CHART_VARS.series1}
            strokeWidth={2}
            dot={{ fill: CHART_VARS.series1, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke={CHART_VARS.series3}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
