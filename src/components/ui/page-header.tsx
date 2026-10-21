/**
 * PageHeader — the title block at the top of every page: title, one line of
 * context, optional actions on the right, and an optional row of content
 * underneath (typically a <KpiStrip>). Plain white with a bottom rule, so the
 * page's own data is the first thing that carries weight.
 *
 * Usage:
 *   <PageHeader
 *     title="Accounts"
 *     subtitle="99 customers across four business units"
 *     action={<RefreshButton />}
 *   >
 *     <KpiStrip items={[...]} />
 *   </PageHeader>
 */

import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  /** Right-hand action slot (buttons) */
  action?: React.ReactNode
  /** Kept for API compatibility; headers are always left-aligned now */
  centered?: boolean
  /** Content rendered below the title row (e.g. a KpiStrip) */
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
  return (
    <header className="page-header border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-7 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 style={{ margin: 0 }}>{title}</h1>
            {subtitle && (
              <p className="mt-1" style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex shrink-0 flex-wrap items-center gap-2" data-print="hide">
              {action}
            </div>
          )}
        </div>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </header>
  )
}
