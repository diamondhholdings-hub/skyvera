/**
 * Metric Card Component
 * Exact match to reference HTML styling
 */

type MetricCardVariant = 'primary' | 'success' | 'warning' | 'danger'

interface MetricCardProps {
  variant: MetricCardVariant
  label: string
  value: string
  subtitle: string
}

const variantStyles: Record<MetricCardVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  },
  success: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
  },
  warning: {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)',
  },
  danger: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
  },
}

export function MetricCard({ variant, label, value, subtitle }: MetricCardProps) {
  return (
    <div className="card-hover animate-fade-in" style={variantStyles[variant]}>
      <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>{label}</div>
      <div style={{ fontSize: '2.3em', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '0.8em', opacity: 0.85, marginTop: '5px' }}>{subtitle}</div>
    </div>
  )
}
