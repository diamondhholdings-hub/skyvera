/**
 * Alert Box Component
 * Tinted callout with a full border and a leading status icon; see the
 * `.alert-*` rules in globals.css.
 */

import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'

type AlertVariant = 'critical' | 'warning' | 'info' | 'success'

interface AlertBoxProps {
  variant: AlertVariant
  children: ReactNode
}

const variantClass: Record<AlertVariant, string> = {
  critical: 'alert-box alert-critical',
  warning: 'alert-box alert-warning',
  info: 'alert-box alert-info',
  success: 'alert-box alert-success',
}

const variantIcon = {
  critical: CircleAlert,
  warning: TriangleAlert,
  info: Info,
  success: CircleCheck,
}

export function AlertBox({ variant, children }: AlertBoxProps) {
  const Icon = variantIcon[variant]
  return (
    <div className={`${variantClass[variant]} flex items-start gap-3 text-sm`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1" style={{ lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}
