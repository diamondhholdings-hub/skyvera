import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

/**
 * Empty state for missing data: says what's missing and how to get it.
 * Used across account plan tabs when no data is available.
 */

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-start gap-2 p-6"
      style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)' }}
    >
      <div style={{ color: 'var(--muted)' }}>{icon || <FileQuestion className="h-5 w-5" aria-hidden="true" />}</div>
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      <p className="m-0 max-w-prose text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
      {action && (
        <div className="pt-1">
          {action.href ? (
            <Link href={action.href} className="btn btn-primary">{action.label}</Link>
          ) : (
            <button type="button" onClick={action.onClick} className="btn btn-primary">{action.label}</button>
          )}
        </div>
      )}
    </div>
  )
}
