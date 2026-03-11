'use client'

/**
 * PrintButton - Triggers browser print dialog for PDF export
 * Client Component because it calls window.print()
 * Editorial theme: accent border, transparent bg, fills on hover
 */

import { Printer } from 'lucide-react'

interface PrintButtonProps {
  customerName: string
}

export function PrintButton({ customerName: _customerName }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 text-sm transition-colors"
      style={{
        color: 'var(--paper)',
        border: '1px solid var(--accent)',
        background: 'transparent',
        padding: '0.375rem 0.75rem',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget
        btn.style.background = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget
        btn.style.background = 'transparent'
      }}
      aria-label="Export as PDF"
    >
      <Printer className="w-4 h-4" />
      <span className="hidden sm:inline">Export PDF</span>
    </button>
  )
}
