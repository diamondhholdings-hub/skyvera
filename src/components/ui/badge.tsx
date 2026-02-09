/**
 * Badge - Small pill-shaped badge with color-coded background
 * Server Component - no interactivity needed
 * Used for BU labels, status tags
 */

import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger'
  children: ReactNode
}

const variantStyles = {
  default: 'bg-slate-100 text-slate-800 border-slate-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  danger: 'bg-red-100 text-red-800 border-red-300',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
