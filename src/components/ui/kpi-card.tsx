/**
 * KPICard — Dashboard KPI metric card
 * Shows current value, target, and delta with clear visual hierarchy.
 * Uses CSS design tokens throughout.
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
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '20px 22px',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'background 0.2s ease',
      }}
    >
      {/* Label */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(148,163,184,0.7)',
          margin: 0,
        }}
      >
        {title}
      </p>

      {/* Value */}
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.875rem',
          fontWeight: 700,
          color: '#FFFFFF',
          margin: 0,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {formatValue(value)}
      </p>

      {/* Target + Delta row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '4px',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: 'rgba(148,163,184,0.6)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Target: {formatValue(target)}
        </span>
        {target !== 0 && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.01em',
              background: isPositive
                ? 'rgba(5,150,105,0.15)'
                : 'rgba(220,38,38,0.15)',
              color: isPositive ? '#34D399' : '#F87171',
              border: `1px solid ${isPositive ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
