/**
 * Card - bordered panel with optional title row
 * Server Component - no interactivity needed
 */

import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {title && (
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          <h2 className="m-0 text-base font-semibold">{title}</h2>
        </div>
      )}
      <div className={title ? 'p-5' : ''}>{children}</div>
    </div>
  )
}
