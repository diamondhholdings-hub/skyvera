/**
 * Badge - Small pill-shaped badge with color-coded background
 * Server Component - no interactivity needed
 * Used for BU labels, status tags
 * Editorial theme: compact badges with editorial color palette
 */

import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger'
  children: ReactNode
}

const variantStyles = {
  default: 'bg-secondary/10 text-secondary',
  success: 'bg-[var(--success)]/20 text-[#2e7d32]',
  warning: 'bg-[var(--warning)]/20 text-[#e65100]',
  danger: 'bg-[var(--critical)]/20 text-[#c62828]',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
