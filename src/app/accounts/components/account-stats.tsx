/**
 * AccountStats - Summary statistics for customer accounts
 * Server Component - displays total customers and health breakdown
 * Styled as translucent white cards inside the dark PageHeader.
 * Numbers use font-mono (matching KPICard) for visual consistency.
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

interface StatCardProps {
  label: string
  value: string | number
  /** Optional dot color for health status */
  dotColor?: string
}

function StatCard({ label, value, dotColor }: StatCardProps) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(148,163,184,0.7)',
          margin: '0 0 0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        {dotColor && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#FFFFFF',
          margin: 0,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </p>
    </div>
  )
}

export function AccountStats({ stats, totalRevenue }: AccountStatsProps) {
  const healthyAccounts = stats.byHealth.green
  const atRiskAccounts = stats.byHealth.yellow + stats.byHealth.red

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        maxWidth: '900px',
        margin: '2rem auto 0',
      }}
      className="md:grid-cols-4"
    >
      <StatCard label="Total Customers" value={stats.total} />
      <StatCard label="Total Revenue" value={formatRevenue(totalRevenue)} />
      <StatCard label="Healthy Accounts" value={healthyAccounts} dotColor="#10B981" />
      <StatCard label="At-Risk Accounts" value={atRiskAccounts} dotColor="#F59E0B" />
    </div>
  )
}
