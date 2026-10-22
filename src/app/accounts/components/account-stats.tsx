/**
 * AccountStats - Summary statistics for customer accounts
 * Server Component - total customers, revenue and health breakdown as a KpiStrip
 */

import { KpiStrip } from '@/components/ui/kpi-strip'

interface AccountStatsProps {
  stats: {
    total: number
    byBU: Record<string, number>
    byHealth: {
      green: number
      yellow: number
      red: number
    }
  }
  totalRevenue: number
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function AccountStats({ stats, totalRevenue }: AccountStatsProps) {
  const healthyAccounts = stats.byHealth.green
  const atRiskAccounts = stats.byHealth.yellow + stats.byHealth.red
  const pct = (n: number) => (stats.total > 0 ? Math.round((n / stats.total) * 100) : 0)

  return (
    <KpiStrip
      items={[
        { label: 'Total customers', value: stats.total, context: `${Object.keys(stats.byBU).length} business units` },
        { label: 'Total revenue', value: formatRevenue(totalRevenue), context: 'Recurring and non-recurring' },
        { label: 'Healthy accounts', value: healthyAccounts, context: `${pct(healthyAccounts)}% of customers`, tone: 'success' },
        {
          label: 'At-risk accounts',
          value: atRiskAccounts,
          context: `${stats.byHealth.yellow} at risk, ${stats.byHealth.red} critical`,
          tone: atRiskAccounts > 0 ? 'warning' : 'default',
        },
      ]}
    />
  )
}
