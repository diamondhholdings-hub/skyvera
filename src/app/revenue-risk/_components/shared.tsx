import Link from 'next/link'
import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { accountHref } from '../_lib/view-model'

/** Customer name, linked to its account page only when that account exists. */
export function CustomerName({ name }: { name: string }) {
  const href = accountHref(name)
  if (!href) return <span className="font-medium">{name}</span>
  return (
    <Link href={href} className="rr-link font-medium">
      {name}
    </Link>
  )
}

type Tone = 'critical' | 'warning' | 'success' | 'neutral' | 'info'

const ICONS: Record<Tone, typeof CircleX | null> = {
  critical: CircleX,
  warning: TriangleAlert,
  success: CircleCheck,
  info: CircleAlert,
  neutral: null,
}

/** Status tag: tint plus an icon plus a word, so color is never the only signal. */
export function StatusTag({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = ICONS[tone]
  return (
    <span
      className={`badge-${tone} inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-xs)] px-1.5 py-0.5 text-xs font-medium`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Panel with a title row and a full-bleed table body. */
export function TablePanel({
  title,
  description,
  aside,
  children,
}: {
  title: string
  description?: ReactNode
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card overflow-hidden">
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold">{title}</h2>
          {description && (
            <p className="m-0 mt-0.5 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
              {description}
            </p>
          )}
        </div>
        {aside}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

export const right = { textAlign: 'right' } as const
