import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

/**
 * Reusable empty state component for missing data scenarios
 * Used across account plan tabs when no data is available
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
  const defaultIcon = <FileQuestion className="h-12 w-12 text-gray-400" />

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      {/* Icon */}
      <div className="flex items-center justify-center">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 max-w-md text-center">
        {description}
      </p>

      {/* Optional action button */}
      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
