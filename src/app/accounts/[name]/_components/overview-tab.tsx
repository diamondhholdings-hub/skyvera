/**
 * OverviewTab - Account overview with KPIs, health factors, and intelligence snippet
 * Server Component - receives data as props
 * Displays: ARR, Total Revenue, Health Score, Subscription Count, Quick Summary
 */

import type { CustomerWithHealth } from '@/lib/types/customer'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface OverviewTabProps {
  customer: CustomerWithHealth
  intelligenceReport: string // Raw markdown
}

export function OverviewTab({ customer, intelligenceReport }: OverviewTabProps) {
  const arr = customer.rr * 4
  const subscriptionCount = customer.subscriptions?.length || 0

  // Format currency helper
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${(value / 1000).toFixed(0)}K`
  }

  // Truncate intelligence report for preview (first 500 chars)
  const truncatedReport = intelligenceReport
    ? intelligenceReport.substring(0, 500) + (intelligenceReport.length > 500 ? '...' : '')
    : null

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="ARR" value={formatCurrency(arr)} />
        <KPICard title="Total Revenue" value={formatCurrency(customer.total)} />
        <KPICard title="Health Score" value={customer.healthScore} isHealth />
        <KPICard title="Subscriptions" value={subscriptionCount.toString()} />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Summary */}
        <Card title="Account Summary">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-slate-600">Customer Name</dt>
              <dd className="text-base text-slate-900 mt-1">{customer.customer_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Business Unit</dt>
              <dd className="text-base text-slate-900 mt-1">{customer.bu}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Rank</dt>
              <dd className="text-base text-slate-900 mt-1">
                #{customer.rank} of total customers
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">% of Total Revenue</dt>
              <dd className="text-base text-slate-900 mt-1">
                {customer.pct_of_total !== undefined ? customer.pct_of_total.toFixed(2) : 'N/A'}%
              </dd>
            </div>
          </dl>
        </Card>

        {/* Quick Intelligence */}
        <Card title="Quick Intelligence">
          {truncatedReport ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{truncatedReport}</p>
              <Link
                href={`?tab=intelligence`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-block"
              >
                View full report on Intelligence tab →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No intelligence report available</p>
              <p className="text-xs text-slate-400 mt-1">
                Intelligence reports are generated for key accounts
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Health Factors */}
      <Card title="Health Factors">
        {customer.healthFactors && customer.healthFactors.length > 0 ? (
          <ul className="space-y-2">
            {customer.healthFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span className="text-sm text-slate-700">{factor}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No specific health factors recorded</p>
        )}
      </Card>
    </div>
  )
}

/**
 * Simple KPI Card for overview metrics
 */
function KPICard({
  title,
  value,
  isHealth = false,
}: {
  title: string
  value: string | number
  isHealth?: boolean
}) {
  const healthConfig = {
    green: { color: 'bg-green-100 text-green-800', icon: '✓' },
    yellow: { color: 'bg-yellow-100 text-yellow-800', icon: '⚠' },
    red: { color: 'bg-red-100 text-red-800', icon: '✕' },
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      {isHealth ? (
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              healthConfig[value as keyof typeof healthConfig]?.color || 'bg-slate-100 text-slate-800'
            }`}
          >
            {healthConfig[value as keyof typeof healthConfig]?.icon || '?'}
            <span className="capitalize">{value}</span>
          </span>
        </div>
      ) : (
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      )}
    </div>
  )
}
