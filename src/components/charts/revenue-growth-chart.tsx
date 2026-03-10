'use client'

/**
 * RevenueGrowthChart - Bar chart comparing current vs projected ARR per subscription
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Subscription } from '@/lib/types/customer'

interface RevenueGrowthChartProps {
  subscriptions: Subscription[]
}

function formatK(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  return `$${(value / 1_000).toFixed(0)}K`
}

export function RevenueGrowthChart({ subscriptions }: RevenueGrowthChartProps) {
  const data = subscriptions
    .filter(s => s.arr != null && s.arr > 0)
    .slice(0, 8) // cap at 8 bars for readability
    .map((s, i) => ({
      name: s.sub_id ? `Sub ${s.sub_id}` : `Sub ${i + 1}`,
      current: s.arr ?? 0,
      projected: s.projected_arr ?? s.arr ?? 0,
    }))

  if (data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        No subscription data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => formatK(value as number)}
          contentStyle={{ border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem' }}
        />
        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
        <Bar dataKey="current" name="Current ARR" fill="#2d4263" radius={[2, 2, 0, 0]} />
        <Bar dataKey="projected" name="Projected ARR" fill="#c84b31" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
