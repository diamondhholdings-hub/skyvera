/**
 * Card - White card wrapper with optional title header
 * Server Component - no interactivity needed
 * Composable wrapper for dashboard sections
 * Editorial theme: subtle border, soft shadow, Cormorant Garamond title
 */

import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-[var(--paper)] relative overflow-hidden group rounded border border-[var(--border)] shadow-sm card-hover animate-fade-in-up ${className}`}>
      <span className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] scale-x-0 origin-left transition-transform duration-[600ms] ease-in-out group-hover:scale-x-1 pointer-events-none z-10" />
      {title && (
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-secondary m-0">{title}</h2>
        </div>
      )}
      <div className={title ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  )
}
