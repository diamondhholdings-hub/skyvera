/**
 * Metric Card Component (legacy; the dashboard now uses KpiStrip)
 * Flat bordered panel; `danger`/`warning` get a status tint.
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
      className={variantClass[variant]}
      role="group"
      aria-label={ariaLabel}
    >
      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--muted)' }}>{label}</div>
      <div className="metric-value num" style={{ fontSize: '1.375rem', fontWeight: 600, marginTop: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{subtitle}</div>
    </div>
  )
}
