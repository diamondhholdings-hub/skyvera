'use client'

/**
 * ExportButton - downloads /api/export/accounts as a CSV file
 * Hidden from print view, matching RefreshButton's convention.
 */

import { Download } from 'lucide-react'

interface ExportButtonProps {
  /** Kept for compatibility; all headers are light now */
  variant?: 'default' | 'on-dark'
}

export function ExportButton(_props: ExportButtonProps) {
  return (
    <a href="/api/export/accounts" data-print="hide" className="btn" aria-label="Export accounts as CSV">
      <Download className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Export CSV</span>
    </a>
  )
}
