'use client'

/**
 * ExportButton - downloads /api/export/accounts as a CSV file
 * Hidden from print view, matching RefreshButton's convention.
 */

interface ExportButtonProps {
  variant?: 'default' | 'on-dark'
}

export function ExportButton({ variant = 'default' }: ExportButtonProps) {
  const colorClasses =
    variant === 'on-dark' ? 'text-white/85 hover:text-white' : 'text-muted hover:text-ink'

  return (
    <a
      href="/api/export/accounts"
      data-print="hide"
      className={`inline-flex items-center gap-2 text-sm ${colorClasses} transition-colors`}
      aria-label="Export accounts as CSV"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </a>
  )
}
