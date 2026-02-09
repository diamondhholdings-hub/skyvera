/**
 * Card - White card wrapper with optional title header
 * Server Component - no interactivity needed
 * Composable wrapper for dashboard sections
 */

import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-200 ${className}`}
    >
      {title && (
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
      )}
      <div className={title ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  )
}
