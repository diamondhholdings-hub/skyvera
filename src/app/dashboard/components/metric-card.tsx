/**
 * Metric Card Component
 * Gradient cards with semantic color variants for displaying KPIs
 */

type MetricCardVariant = 'primary' | 'success' | 'warning' | 'danger'

interface MetricCardProps {
  variant: MetricCardVariant
  label: string
  value: string
  subtitle: string
}

const variantStyles: Record<MetricCardVariant, string> = {
  primary: 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-[0_4px_15px_rgba(102,126,234,0.4)]',
  success: 'bg-gradient-to-br from-[#4facfe] to-[#00f2fe] shadow-[0_4px_15px_rgba(79,172,254,0.4)]',
  warning: 'bg-gradient-to-br from-[#fa709a] to-[#fee140] shadow-[0_4px_15px_rgba(250,112,154,0.4)]',
  danger: 'bg-gradient-to-br from-[#f093fb] to-[#f5576c] shadow-[0_4px_15px_rgba(240,147,251,0.4)]',
}

export function MetricCard({ variant, label, value, subtitle }: MetricCardProps) {
  return (
    <div
      className={`
        ${variantStyles[variant]}
        text-white p-6 rounded-2xl
      `}
    >
      <div className="text-[0.85rem] opacity-90 mb-2.5">{label}</div>
      <div className="text-[2.3rem] font-bold leading-tight">{value}</div>
      <div className="text-[0.8rem] opacity-85 mt-1">{subtitle}</div>
    </div>
  )
}
