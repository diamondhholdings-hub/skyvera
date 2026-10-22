/**
 * Small server-rendered building blocks for the cost page: panels, the
 * business-unit filter (links, so it stays bookmarkable) and the over/under
 * model marker. No event handlers: everything here is a Server Component.
 */
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function Panel({
  title,
  description,
  action,
  children,
  flush = false,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  /** Panel holds a table: no inner padding, rule under the title row */
  flush?: boolean
}) {
  return (
    <section className="card overflow-hidden">
      <div
        className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4"
        style={flush ? { borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' } : undefined}
      >
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold">{title}</h2>
          {description && (
            <p className="m-0 mt-0.5 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className={flush ? '' : 'px-5 pb-5 pt-3'}>{children}</div>
    </section>
  )
}

/** Header cell / data cell alignment helpers */
export const right = { textAlign: 'right' as const }

export function buildHref(tab: string, bu: string | null): string {
  const params = new URLSearchParams({ tab })
  if (bu) params.set('bu', bu)
  return `?${params.toString()}`
}

/** Segmented business-unit filter rendered as links (?bu=) */
export function BUFilter({ tab, bus, active }: { tab: string; bus: string[]; active: string | null }) {
  const options: Array<{ label: string; value: string | null }> = [
    { label: 'All units', value: null },
    ...bus.map((b) => ({ label: b, value: b })),
  ]
  return (
    <nav aria-label="Business unit filter" className="flex min-w-0 flex-col gap-1.5">
      <span className="section-label">Business unit</span>
      <div className="max-w-full overflow-x-auto">
        <div className="segmented">
          {options.map((o) => (
            <Link
              key={o.label}
              href={buildHref(tab, o.value)}
              scroll={false}
              prefetch={false}
              aria-current={o.value === active ? 'page' : undefined}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

/**
 * A figure compared with the cost model. The arrow shows direction; a bad
 * variance (over the model on cost, below target on margin) is also bold in
 * the critical color, and the screen-reader text names it. Color is never
 * the only signal.
 */
export function VsModel({
  children,
  direction,
  bad,
  srLabel,
}: {
  children: ReactNode
  direction: 'up' | 'down' | 'flat'
  bad: boolean
  srLabel: string
}) {
  if (direction === 'flat') return <span className="num">{children}</span>
  const Icon = direction === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className="num inline-flex items-center justify-end gap-1 whitespace-nowrap"
      style={{ color: bad ? 'var(--critical-ink)' : 'var(--ink-2)', fontWeight: bad ? 600 : 400 }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
      <span className="sr-only"> {srLabel}</span>
    </span>
  )
}

/** Legend explaining the over/under markers */
export function ModelLegend() {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
      <span className="inline-flex items-center gap-1" style={{ color: 'var(--critical-ink)' }}>
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        Cost over the model
      </span>
      <span className="inline-flex items-center gap-1" style={{ color: 'var(--critical-ink)' }}>
        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
        Margin below target
      </span>
      <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-2)' }}>
        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
        Cost under the model
      </span>
    </p>
  )
}

/** Quiet share bar used next to a percentage in breakdown tables */
export function ShareBar({ share }: { share: number }) {
  const width = Math.max(0, Math.min(100, share))
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1 w-16 overflow-hidden align-middle"
      style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-xs)' }}
    >
      <span className="block h-full" style={{ width: `${width}%`, background: 'var(--secondary)' }} />
    </span>
  )
}
