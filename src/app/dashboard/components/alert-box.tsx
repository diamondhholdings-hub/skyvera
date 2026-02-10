/**
 * Alert Box Component
 * Exact match to reference HTML styling
 */

import type { ReactNode } from 'react'

type AlertVariant = 'critical' | 'warning' | 'info' | 'success'

interface AlertBoxProps {
  variant: AlertVariant
  children: ReactNode
}

const variantStyles: Record<AlertVariant, React.CSSProperties> = {
  critical: {
    background: '#ffe5e5',
    borderLeft: '5px solid #f5576c',
    color: '#c92a2a',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    fontWeight: 500,
  },
  warning: {
    background: '#fff9db',
    borderLeft: '5px solid #fee140',
    color: '#7c6300',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    fontWeight: 500,
  },
  info: {
    background: '#e3f2fd',
    borderLeft: '5px solid #4facfe',
    color: '#0d47a1',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    fontWeight: 500,
  },
  success: {
    background: '#e8f5e9',
    borderLeft: '5px solid #4caf50',
    color: '#2e7d32',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    fontWeight: 500,
  },
}

export function AlertBox({ variant, children }: AlertBoxProps) {
  return <div style={variantStyles[variant]}>{children}</div>
}
