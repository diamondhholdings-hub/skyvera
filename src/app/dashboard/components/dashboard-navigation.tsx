'use client'

/**
 * 7-Section Dashboard Navigation
 * Uses CSS design tokens throughout — no hardcoded hex colors
 *
 * A11y notes:
 * - Tabs are <a> links (real navigation), inside <nav aria-label>
 * - Active link gets aria-current="page"
 * - Hover / focus styling lives in globals.css (.dashboard-tab) — no JS event handlers
 */

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sections = [
  { id: 'financial-summary', label: 'Financial Summary' },
  { id: 'financial-detailed', label: 'Financial Analysis' },
  { id: 'customer-summary', label: 'Customer Summary' },
  { id: 'top-customers', label: 'Top Customers' },
  { id: 'at-risk', label: 'At-Risk Accounts' },
  { id: 'expansion', label: 'Expansion Pipeline' },
  { id: 'action-plan', label: 'Action Plan' },
]

export function DashboardNavigation() {
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('section') || 'financial-summary'

  return (
    <nav
      aria-label="Dashboard sections"
      className="bg-[var(--highlight)] border-b border-[var(--border)] flex gap-2 flex-wrap px-10 py-4 sticky top-0 z-[100]"
    >
      {sections.map(({ id, label }) => {
        const isActive = activeSection === id
        return (
          <Link
            key={id}
            href={`/dashboard?section=${id}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className="dashboard-tab"
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
