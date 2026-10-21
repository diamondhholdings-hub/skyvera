/**
 * MarginComparison - Client Component using Recharts for BU margin comparison
 * Shows actual vs target margins as grouped bars; actual bars are status-coded
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
import { CHART_VARS, TOOLTIP_STYLE } from '@/components/charts/chart-colors'

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

  const tick = { fontSize: 11, fill: CHART_VARS.axis }

  return (
    <div className="card p-5">
      <h3 className="m-0 mb-4">Margin by business unit</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid stroke={CHART_VARS.grid} vertical={false} />
          <XAxis dataKey="bu" tick={tick} axisLine={{ stroke: CHART_VARS.grid }} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value) => `${value}%`} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--highlight)' }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--ink-2)' }} />
          <Bar dataKey="actual" name="Actual margin" fill={CHART_VARS.series1} radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.meetsTarget ? 'var(--success-ink)' : 'var(--critical-ink)'} />
            ))}
          </Bar>
          <Bar dataKey="target" name="Target margin" fill={CHART_VARS.series3} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
