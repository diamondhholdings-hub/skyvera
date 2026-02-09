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

  // Inline styles that will definitely render
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    borderLeft: `6px solid ${isPositive ? '#10b981' : '#ef4444'}`,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: 'box-shadow 0.2s',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  }

  const valueStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 700,
    color: '#0f172a',
    marginTop: '12px',
    marginBottom: '12px',
  }

  const targetContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
  }

  const targetTextStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#475569',
  }

  const badgeStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '9999px',
    backgroundColor: isPositive ? '#dcfce7' : '#fee2e2',
    color: isPositive ? '#15803d' : '#b91c1c',
  }

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={valueStyle}>{formatValue(value)}</p>
      <div style={targetContainerStyle}>
        <span style={targetTextStyle}>Target: {formatValue(target)}</span>
        {target !== 0 && (
          <span style={badgeStyle}>
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
