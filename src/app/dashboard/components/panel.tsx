/**
 * Panel - bordered container with a title row (heading left, action right).
 * `flush` drops the body padding and adds a rule under the title, for tables.
 * Server Component.
 */

import type { ReactNode } from 'react'

interface PanelProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  flush?: boolean
  /** Heading level for the title; h3 inside a section, h2 when standalone */
  as?: 'h2' | 'h3'
  children: ReactNode
}

export function Panel({ title, description, action, flush = false, as: Heading = 'h3', children }: PanelProps) {
  return (
    <div className="card overflow-hidden">
      <div
        className={`flex flex-wrap items-start justify-between gap-3 px-5 ${flush ? 'border-b py-4' : 'pt-4'}`}
        style={flush ? { borderColor: 'var(--border)' } : undefined}
      >
        <div className="min-w-0">
          <Heading className="m-0" style={{ fontSize: '1rem' }}>{title}</Heading>
          {description && (
            <p className="m-0 mt-0.5 text-[13px]" style={{ color: 'var(--muted)' }}>{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      <div className={flush ? '' : 'px-5 pb-5 pt-3'}>{children}</div>
    </div>
  )
}

/** Section heading row used at the top of each dashboard section */
export function SectionHeading({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="m-0">{title}</h2>
        {description && (
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

/** Signed figure colored by direction; the sign carries the meaning too */
export function SignedFigure({ value, good }: { value: string; good: boolean | null }) {
  const color = good === null ? 'var(--muted)' : good ? 'var(--success-ink)' : 'var(--critical-ink)'
  return (
    <span className="num font-medium" style={{ color }}>
      {value}
    </span>
  )
}
