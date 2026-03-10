'use client'

/**
 * TopCustomersChart - Horizontal bar chart of top 10 customers in the same BU by ARR
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CustomerWithHealth } from '@/lib/types/customer'

interface TopCustomersChartProps {
  allBuCustomers: CustomerWithHealth[]
  currentCustomerName: string
}

function formatK(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  return `$${(value / 1_000).toFixed(0)}K`
}

export function TopCustomersChart({ allBuCustomers, currentCustomerName }: TopCustomersChartProps) {
  const top10 = [...allBuCustomers]
    .sort((a, b) => (b.rr + b.nrr) - (a.rr + a.nrr))
    .slice(0, 10)
    .map(c => ({
      name: c.customer_name.length > 18 ? c.customer_name.slice(0, 16) + '…' : c.customer_name,
      fullName: c.customer_name,
      arr: c.rr + c.nrr,
      isCurrent: c.customer_name === currentCustomerName,
    }))

  if (top10.length === 0) {
    return (
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        No customer data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top10} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" horizontal={false} />
        <XAxis type="number" tickFormatter={formatK} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) => [formatK(value as number), props.payload.fullName]}
          contentStyle={{ border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem' }}
        />
        <Bar dataKey="arr" name="ARR" radius={[0, 2, 2, 0]}>
          {top10.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isCurrent ? '#c84b31' : '#2d4263'}
              opacity={entry.isCurrent ? 1 : 0.65}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
