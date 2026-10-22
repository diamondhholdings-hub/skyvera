/**
 * Badge - small status/label tag (4px corners, never pill-shaped)
 * Server Component - no interactivity needed
 */

import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger'
  children: ReactNode
}

const variantClass = {
  default: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-critical',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 text-xs font-medium ${variantClass[variant]}`}
      style={{ borderRadius: 'var(--radius-xs)' }}
    >
      {children}
    </span>
  )
}
