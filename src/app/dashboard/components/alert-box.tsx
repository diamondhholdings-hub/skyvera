/**
 * Alert Box Component
 * Colored alert boxes with semantic variants
 */

import type { ReactNode } from 'react'

type AlertVariant = 'critical' | 'warning' | 'info' | 'success'

interface AlertBoxProps {
  variant: AlertVariant
  children: ReactNode
}

const variantStyles: Record<AlertVariant, string> = {
  critical: 'bg-red-50 border-l-4 border-red-500 text-red-900',
  warning: 'bg-amber-50 border-l-4 border-amber-500 text-amber-900',
  info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-900',
  success: 'bg-green-50 border-l-4 border-green-500 text-green-900',
}

export function AlertBox({ variant, children }: AlertBoxProps) {
  return (
    <div className={`${variantStyles[variant]} p-6 rounded-xl my-6 leading-relaxed`}>{children}</div>
  )
}
