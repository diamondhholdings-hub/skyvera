/**
 * HealthIndicator - Accessible health status: icon + label + color, never color alone
 * Server Component - no interactivity needed
 */

import { CircleCheck, TriangleAlert, CircleX } from 'lucide-react'

interface HealthIndicatorProps {
  score: 'green' | 'yellow' | 'red'
  label?: string
}

const healthConfig = {
  green: { Icon: CircleCheck, color: 'var(--success-ink)', text: 'Healthy', ariaLabel: 'Account health: Good' },
  yellow: { Icon: TriangleAlert, color: 'var(--warning-ink)', text: 'At Risk', ariaLabel: 'Account health: Warning' },
  red: { Icon: CircleX, color: 'var(--critical-ink)', text: 'Critical', ariaLabel: 'Account health: Critical' },
}

export function HealthIndicator({ score, label }: HealthIndicatorProps) {
  const { Icon, color, text, ariaLabel } = healthConfig[score]

  return (
    <div className="flex items-center gap-1.5" aria-label={ariaLabel}>
      <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
      <span className="text-sm font-medium" style={{ color }}>{label || text}</span>
    </div>
  )
}
