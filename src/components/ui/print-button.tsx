'use client'

/**
 * PrintButton - Triggers browser print dialog for PDF export
 * Client Component because it calls window.print()
 */

import { Printer } from 'lucide-react'

interface PrintButtonProps {
  customerName: string
}

export function PrintButton({ customerName: _customerName }: PrintButtonProps) {
  return (
    <button type="button" onClick={() => window.print()} className="btn" aria-label="Export as PDF">
      <Printer className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Export PDF</span>
    </button>
  )
}
