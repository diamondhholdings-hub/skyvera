/**
 * KPICard — a single metric with target and delta. Flat bordered cell;
 * prefer <KpiStrip> when showing several metrics together.
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
    if (format === 'currency') return `$${(val / 1_000_000).toFixed(1)}M`
    if (format === 'percentage') return `${val.toFixed(1)}%`
    return val.toLocaleString()
  }

  return (
    <div className="card px-4 py-3.5">
      <p className="m-0 text-[0.8125rem] font-medium" style={{ color: 'var(--muted)' }}>{title}</p>
      <p className="num m-0 mt-1 text-[1.375rem] font-semibold leading-tight">{formatValue(value)}</p>
      <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
        <span>Target {formatValue(target)}</span>
        {target !== 0 && (
          <span className="num font-medium" style={{ color: isPositive ? 'var(--success-ink)' : 'var(--critical-ink)' }}>
            {isPositive ? '+' : '−'}{Math.abs(delta).toFixed(1)}% vs target
          </span>
        )}
      </div>
    </div>
  )
}
