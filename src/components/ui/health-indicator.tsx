/**
 * HealthIndicator - Accessible health score visualization
 * Server Component - no interactivity needed
 * Pattern from 02-RESEARCH.md Pattern 5 with color + icon + text + aria-label
 * WCAG 2.2 Level AA compliant - never color alone
 */

interface HealthIndicatorProps {
  score: 'green' | 'yellow' | 'red'
  label?: string
}

const healthConfig = {
  green: {
    color: 'bg-green-500',
    icon: '✓',
    text: 'Healthy',
    ariaLabel: 'Account health: Good',
  },
  yellow: {
    color: 'bg-yellow-500',
    icon: '⚠',
    text: 'At Risk',
    ariaLabel: 'Account health: Warning',
  },
  red: {
    color: 'bg-red-500',
    icon: '✕',
    text: 'Critical',
    ariaLabel: 'Account health: Critical',
  },
}

export function HealthIndicator({ score, label }: HealthIndicatorProps) {
  const config = healthConfig[score]

  return (
    <div className="flex items-center gap-2" aria-label={config.ariaLabel}>
      <span className={`${config.color} w-3 h-3 rounded-full`} aria-hidden="true" />
      <span className="font-medium">{config.icon}</span>
      <span className="text-sm">{label || config.text}</span>
    </div>
  )
}
