/**
 * KPICard - Dashboard KPI card showing current value, target, and delta
 * Server Component - no interactivity needed
 * Pattern from 02-RESEARCH.md Pattern 6
 * Editorial theme: Cormorant Garamond for values, accent/critical border, subtle shadow
 */

interface KPICardProps {
  title: string
  value: number
  target: number
  format?: 'currency' | 'percentage' | 'number'
}

export function KPICard({ title, value, target, format = 'number' }: KPICardProps) {
  const delta = target !== 0 ? ((value - target) / target) * 100 : 0
  const isPositive = delta >= 0

  const formatValue = (val: number) => {
    if (format === 'currency') return `$${(val / 1000000).toFixed(1)}M`
    if (format === 'percentage') return `${val.toFixed(1)}%`
    return val.toLocaleString()
  }

  return (
    <div
      className={`bg-white p-6 rounded border border-[var(--border)] shadow-sm transition-shadow ${
        isPositive ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-[var(--critical)]'
      }`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
        {title}
      </h3>
      <p className="text-3xl font-display font-semibold text-secondary my-3">
        {formatValue(value)}
      </p>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-sm text-muted">Target: {formatValue(target)}</span>
        {target !== 0 && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isPositive
                ? 'bg-[var(--success)]/20 text-[#2e7d32]'
                : 'bg-[var(--critical)]/20 text-[#c62828]'
            }`}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
