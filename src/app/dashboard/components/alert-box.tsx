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
  critical: 'bg-[#ffe5e5] border-l-[5px] border-[#f5576c] text-[#c92a2a]',
  warning: 'bg-[#fff9db] border-l-[5px] border-[#fee140] text-[#7c6300]',
  info: 'bg-[#e3f2fd] border-l-[5px] border-[#4facfe] text-[#0d47a1]',
  success: 'bg-[#e8f5e9] border-l-[5px] border-[#4caf50] text-[#2e7d32]',
}

export function AlertBox({ variant, children }: AlertBoxProps) {
  return (
    <div className={`${variantStyles[variant]} p-5 rounded-lg my-5 font-medium`}>{children}</div>
  )
}
