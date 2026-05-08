/**
 * Alert Box Component
 * Tokenized class-based variants — see `.alert-*` rules in globals.css.
 */

import type { ReactNode } from 'react'

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

export function AlertBox({ variant, children }: AlertBoxProps) {
  return <div className={variantClass[variant]} role="alert">{children}</div>
}
