/**
 * PageHeader — Shared editorial gradient header used across all pages.
 * Provides consistent branding, typography, and layout for every top-level page.
 *
 * Usage:
 *   <PageHeader
 *     title="Page Title"
 *     subtitle="Optional subtitle text"
 *     action={<RefreshButton variant="on-dark" />}  // pass on-dark for AA contrast
 *     centered                                       // optional flag for centered layout
 *   />
 */

import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Right-hand action slot (e.g. RefreshButton) */
  action?: React.ReactNode
  /** Center the title + subtitle instead of left-align */
  centered?: boolean
  /** Extra content rendered below the title/subtitle row (e.g. stat cards) */
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  action,
  centered = false,
  children,
}: PageHeaderProps) {
  return (
    <header
      className="page-header page-header-grid"
      style={{
        background: 'linear-gradient(135deg, var(--nav-bg) 0%, #162544 100%)',
        color: 'var(--paper)',
        padding: centered ? '3.5rem 2rem 3rem' : '3rem 2rem 2.5rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: centered ? 'column' : 'row',
          alignItems: centered ? 'center' : 'flex-start',
          justifyContent: centered ? 'center' : 'space-between',
          gap: '1.25rem',
          textAlign: centered ? 'center' : 'left',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title block */}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                fontWeight: 400,
                color: 'rgba(226,232,240,0.75)',
                marginTop: '0.5rem',
                marginBottom: 0,
                letterSpacing: '0.01em',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Right-side action slot */}
        {action && !centered && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {action}
          </div>
        )}
      </div>

      {/* Slot for extra content (e.g. stat cards) */}
      {children && (
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </div>
      )}

      {/* Centered action below children */}
      {action && centered && (
        <div
          style={{
            maxWidth: '1400px',
            margin: '1rem auto 0',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {action}
        </div>
      )}
    </header>
  )
}
