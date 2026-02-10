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
  primary: 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-[0_4px_15px_rgba(102,126,234,0.4)] text-white',
  success: 'bg-gradient-to-br from-[#4facfe] to-[#00f2fe] shadow-[0_4px_15px_rgba(79,172,254,0.4)] text-white',
  warning: 'bg-gradient-to-br from-[#ffd93d] to-[#ff9a3d] shadow-[0_4px_15px_rgba(255,217,61,0.4)] text-[#333]',
  danger: 'bg-gradient-to-br from-[#ff6b9d] to-[#c9184a] shadow-[0_4px_15px_rgba(255,107,157,0.4)] text-white',
}

export function MetricCard({ variant, label, value, subtitle }: MetricCardProps) {
  return (
    <div
      className={`
        ${variantStyles[variant]}
        p-6 rounded-2xl
      `}
    >
      <div className="text-sm font-medium mb-3 uppercase tracking-wide opacity-95">{label}</div>
      <div className="text-[2.5rem] font-bold leading-none mb-2">{value}</div>
      <div className="text-sm font-medium opacity-90">{subtitle}</div>
    </div>
  )
}
