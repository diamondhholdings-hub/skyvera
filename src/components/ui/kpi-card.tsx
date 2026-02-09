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
    <div
      className={`bg-white p-6 rounded-lg shadow-lg border-l-4 hover:shadow-xl transition-shadow duration-200 ${
        isPositive ? 'border-l-green-500' : 'border-l-red-500'
      }`}
    >
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-4xl font-bold text-slate-900 mt-3">
        {formatValue(value)}
      </p>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-sm text-slate-600">Target: {formatValue(target)}</span>
        {target !== 0 && (
          <span
            className={`text-sm font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
