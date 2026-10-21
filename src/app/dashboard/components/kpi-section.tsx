/**
 * KPISection - Server Component displaying 4 financial KPI cards
 * Calls getDashboardData() directly for server-side data fetching
 */

import { getDashboardData } from '@/lib/data/server/dashboard-data'
import { KPICard } from '@/components/ui/kpi-card'
import { AlertBox } from './alert-box'

export async function KPISection() {
  const result = await getDashboardData()

  if (!result.success) {
    return (
      <AlertBox variant="critical">
        <p className="m-0 font-medium">Unable to load financial data</p>
        <p className="m-0 mt-1 text-sm">{result.error.message}</p>
      </AlertBox>
    )
  }

  const data = result.value

  // Calculate minutes since last update
  const minutesSinceUpdate = Math.floor(
    (Date.now() - data.lastUpdated.getTime()) / 1000 / 60
  )
  const updateText =
    minutesSinceUpdate < 1
      ? 'Just now'
      : minutesSinceUpdate === 1
        ? '1 minute ago'
        : `${minutesSinceUpdate} minutes ago`

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={data.totalRevenue}
          target={data.totalRevenue * 1.05} // 5% above current as target for demo
          format="currency"
        />
        <KPICard
          title="EBITDA"
          value={data.ebitda}
          target={data.ebitdaTarget}
          format="currency"
        />
        <KPICard
          title="Net Margin"
          value={data.netMarginPct}
          target={data.netMarginTarget}
          format="percentage"
        />
        <KPICard
          title="Recurring Revenue"
          value={data.totalRR}
          target={data.rrTarget}
          format="currency"
        />
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>Last updated: {updateText}</p>
    </div>
  )
}
