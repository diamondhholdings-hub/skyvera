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
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: 'box-shadow 0.2s',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  }

  const contentStyle: React.CSSProperties = {
    padding: title ? '24px' : '0',
  }

  return (
    <div style={cardStyle} className={className}>
      {title && (
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
        </div>
      )}
      <div style={contentStyle}>{children}</div>
    </div>
  )
}
