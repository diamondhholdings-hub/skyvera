import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

/**
 * Reusable empty state component for missing data scenarios
 * Used across account plan tabs when no data is available
 * Editorial theme: highlight background, editorial border, accent button
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

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const defaultIcon = <FileQuestion className="h-12 w-12 text-muted" />

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 p-8 bg-highlight/30 rounded-lg border-2 border-dashed border-[var(--border)]">
      {/* Icon */}
      <div className="flex items-center justify-center">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-semibold text-ink">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted max-w-md text-center">
        {description}
      </p>

      {/* Optional action button */}
      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
