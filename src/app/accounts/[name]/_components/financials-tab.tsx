/**
 * FinancialsTab - Detailed financial metrics and subscription breakdown
 * Server Component - receives customer data as props
 * Displays: RR, NRR, Total, ARR, Subscriptions table, Revenue breakdown
 */

import type { CustomerWithHealth } from '@/lib/types/customer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FinancialsTabProps {
  customer: CustomerWithHealth
}

export function FinancialsTab({ customer }: FinancialsTabProps) {
  const arr = customer.rr * 4

  // Format currency helper
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // Calculate revenue percentages for breakdown
  const rrPercent = customer.total > 0 ? (customer.rr / customer.total) * 100 : 0
  const nrrPercent = customer.total > 0 ? (customer.nrr / customer.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Recurring Revenue" value={formatCurrency(customer.rr)} />
        <KPICard title="Non-Recurring Revenue" value={formatCurrency(customer.nrr)} />
        <KPICard title="Total Revenue" value={formatCurrency(customer.total)} highlight />
        <KPICard title="ARR" value={formatCurrency(arr)} />
      </div>

      {/* Subscriptions Table */}
      <Card title="Subscriptions">
        {customer.subscriptions && customer.subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">
                    Sub ID
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-700 uppercase">
                    ARR
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-700 uppercase">
                    Renewal Quarter
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-700 uppercase">
                    Will Renew
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-700 uppercase">
                    Projected ARR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.subscriptions.map((sub) => (
                  <tr key={sub.sub_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{sub.sub_id}</td>
                    <td className="py-3 px-4 text-sm text-slate-900 text-right">
                      {sub.arr !== null ? formatCurrency(sub.arr) : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">{sub.renewal_qtr || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <RenewalBadge willRenew={sub.will_renew || 'TBD'} />
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 text-right">
                      {sub.projected_arr !== null ? formatCurrency(sub.projected_arr) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No subscription data available</p>
          </div>
        )}
      </Card>

      {/* Revenue Breakdown */}
      <Card title="Revenue Breakdown">
        <div className="space-y-4">
          {/* Stacked bar */}
          <div className="flex h-8 rounded-lg overflow-hidden border border-slate-200">
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${rrPercent}%` }}
            >
              {rrPercent > 10 && `${rrPercent.toFixed(0)}%`}
            </div>
            <div
              className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${nrrPercent}%` }}
            >
              {nrrPercent > 10 && `${nrrPercent.toFixed(0)}%`}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Recurring Revenue: {formatCurrency(customer.rr)}
                </p>
                <p className="text-xs text-slate-600">{rrPercent.toFixed(1)}% of total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Non-Recurring Revenue: {formatCurrency(customer.nrr)}
                </p>
                <p className="text-xs text-slate-600">{nrrPercent.toFixed(1)}% of total</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Simple KPI Card
 */
function KPICard({
  title,
  value,
  highlight = false,
}: {
  title: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  )
}

/**
 * Renewal badge with color coding (WCAG: color + icon + text)
 */
function RenewalBadge({ willRenew }: { willRenew: string }) {
  const config = {
    Yes: { variant: 'success' as const, icon: '✓', label: 'Yes' },
    No: { variant: 'danger' as const, icon: '✕', label: 'No' },
    TBD: { variant: 'warning' as const, icon: '?', label: 'TBD' },
  }

  const badgeConfig = config[willRenew as keyof typeof config] || {
    variant: 'default' as const,
    icon: '?',
    label: willRenew,
  }

  return (
    <Badge variant={badgeConfig.variant}>
      <span className="inline-flex items-center gap-1">
        {badgeConfig.icon} {badgeConfig.label}
      </span>
    </Badge>
  )
}
