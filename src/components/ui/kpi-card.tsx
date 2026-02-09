/**
 * KPICard - Dashboard KPI card showing current value, target, and delta
 * Server Component - no interactivity needed
 * Pattern from 02-RESEARCH.md Pattern 6
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mt-2">
        {formatValue(value)}
      </p>
      <div className="flex items-center gap-2 mt-2 text-sm">
        <span className="text-slate-600">Target: {formatValue(target)}</span>
        {target !== 0 && (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
