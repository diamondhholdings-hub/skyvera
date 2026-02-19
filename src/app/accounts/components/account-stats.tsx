/**
 * AccountStats - Summary statistics for customer accounts
 * Server Component - displays total customers and health breakdown
 * Styled as translucent white cards on dark gradient header
 */

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[1200px] mx-auto mt-8">
      {/* Total Customers */}
      <div className="bg-white/10 p-6 rounded text-center">
        <p className="text-xs uppercase tracking-wider text-paper/70 mb-2">Total Customers</p>
        <p className="text-2xl font-display font-bold text-paper">{stats.total}</p>
      </div>

      {/* Total Revenue */}
      <div className="bg-white/10 p-6 rounded text-center">
        <p className="text-xs uppercase tracking-wider text-paper/70 mb-2">Total Revenue</p>
        <p className="text-2xl font-display font-bold text-paper">{formatRevenue(totalRevenue)}</p>
      </div>

      {/* Healthy Accounts */}
      <div className="bg-white/10 p-6 rounded text-center">
        <p className="text-xs uppercase tracking-wider text-paper/70 mb-2">Healthy Accounts</p>
        <p className="text-2xl font-display font-bold text-paper">{healthyAccounts}</p>
      </div>

      {/* At-Risk Accounts */}
      <div className="bg-white/10 p-6 rounded text-center">
        <p className="text-xs uppercase tracking-wider text-paper/70 mb-2">At-Risk Accounts</p>
        <p className="text-2xl font-display font-bold text-paper">{atRiskAccounts}</p>
      </div>
    </div>
  )
}
