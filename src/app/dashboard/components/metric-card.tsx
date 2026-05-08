/**
 * Metric Card Component
 * Severity-based: gradient reserved for `danger`/critical only.
 * Other variants use neutral surface with a colored top-border.
 */

type MetricCardVariant = 'primary' | 'success' | 'warning' | 'danger'

interface MetricCardProps {
  variant: MetricCardVariant
  label: string
  value: string
  subtitle: string
}

const variantSeverityWord: Record<MetricCardVariant, string> = {
  primary: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'critical',
}

const variantClass: Record<MetricCardVariant, string> = {
  primary: 'metric-card metric-card--primary',
  success: 'metric-card metric-card--success',
  warning: 'metric-card metric-card--warning',
  danger: 'metric-card metric-card--critical',
}

export function MetricCard({ variant, label, value, subtitle }: MetricCardProps) {
  const ariaLabel = `${label}, ${variantSeverityWord[variant]}: ${value}`
  return (
    <div
      className={`${variantClass[variant]} card-hover animate-fade-in`}
      role="group"
      aria-label={ariaLabel}
    >
      <div style={{ fontSize: '0.85em', opacity: 0.9, marginBottom: '10px' }}>{label}</div>
      <div className="metric-value" style={{ fontSize: '2.3em', fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8em', opacity: 0.85, marginTop: '5px' }}>{subtitle}</div>
    </div>
  )
}
