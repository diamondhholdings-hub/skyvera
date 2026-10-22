'use client'

/**
 * ARRBreakdownChart - Doughnut chart showing RR vs NRR split
 * Uses Recharts PieChart with innerRadius for doughnut effect
 */

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CHART_VARS, TOOLTIP_STYLE } from './chart-colors'

interface ARRBreakdownChartProps {
  rr: number
  nrr: number
}

const COLORS = [CHART_VARS.series1, CHART_VARS.series2]

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function ARRBreakdownChart({ rr, nrr }: ARRBreakdownChartProps) {
  const data = [
    { name: `Recurring (${formatCurrency(rr)})`, value: rr },
    { name: `Non-Recurring (${formatCurrency(nrr)})`, value: nrr },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        No revenue data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          stroke={CHART_VARS.surface}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => formatCurrency(value as number)}
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: '0.8125rem', paddingTop: '1rem', color: 'var(--ink-2)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
