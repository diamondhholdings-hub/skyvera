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
    <div className="bg-white/5 border border-white/10 rounded-[15px] p-6">
      <h3 className="text-[#00d4ff] text-lg font-bold mb-6 pb-3 border-b border-white/10">
        Revenue Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="quarter"
            stroke="#888"
            style={{ fontSize: '12px', fill: '#888' }}
          />
          <YAxis
            tickFormatter={formatDollar}
            stroke="#888"
            style={{ fontSize: '12px', fill: '#888' }}
          />
          <Tooltip
            formatter={(value) => typeof value === 'number' ? formatDollar(value) : value}
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
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Actual Revenue"
            stroke="#00d4ff"
            strokeWidth={2}
            dot={{ fill: '#00d4ff', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="#2ecc71"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#2ecc71', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
