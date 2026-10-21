'use client'

/**
 * Dashboard section navigation: plain underline tabs on white.
 *
 * A11y notes:
 * - Tabs are <a> links (real navigation), inside <nav aria-label>
 * - Active link gets aria-current="page"
 * - Hover / focus styling lives in globals.css (.dashboard-tab), no JS event handlers
 */

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sections = [
  { id: 'financial-summary', label: 'Financial summary' },
  { id: 'financial-detailed', label: 'Financial analysis' },
  { id: 'customer-summary', label: 'Customer summary' },
  { id: 'top-customers', label: 'Top customers' },
  { id: 'at-risk', label: 'At-risk accounts' },
  { id: 'expansion', label: 'Expansion pipeline' },
  { id: 'action-plan', label: 'Action plan' },
]

export function DashboardNavigation() {
  const searchParams = useSearchParams()
  const activeSection = searchParams.get('section') || 'financial-summary'

  return (
    <div
      className="sticky top-14 z-40 border-b"
      style={{ background: 'var(--paper)', borderColor: 'var(--border)' }}
      data-print="hide"
    >
      <nav
        aria-label="Dashboard sections"
        className="mx-auto flex max-w-[1400px] overflow-x-auto px-4 lg:px-8"
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
    </div>
  )
}
