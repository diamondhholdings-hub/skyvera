'use client'

/**
 * TabNavigation - URL-based tab navigation for account plan pages
 * Client Component - uses useSearchParams for active state
 * Sticky underline tabs on white (.dashboard-tab), scrolls horizontally on narrow screens
 *
 * a11y: Renders as <nav> with <a href="?tab=…"> links and aria-current="page"
 * on the active tab. This avoids the full APG tablist contract while keeping
 * everything bookmarkable, screen-reader-correct, and middle-click friendly.
 */

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface TabNavigationProps {
  accountName: string // URL-encoded customer name
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'key-executives', label: 'Key executives' },
  { id: 'org-structure', label: 'Org structure' },
  { id: 'pain-points', label: 'Pain points' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'action-plan', label: 'Action plan' },
  { id: 'financials', label: 'Financials' },
  { id: 'revenue', label: 'Renewals and AR' },
  { id: 'intelligence', label: 'Intelligence' },
]

function TabNavigationContent({ accountName }: TabNavigationProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  return (
    <nav
      aria-label="Account sections"
      className="sticky top-0 z-[100] border-b"
      style={{ background: 'var(--paper)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex max-w-[1400px] overflow-x-auto px-4 lg:px-8">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <Link
              key={id}
              href={`/accounts/${accountName}?tab=${id}`}
              scroll={false}
              prefetch={false}
              className="dashboard-tab shrink-0"
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function TabNavigation({ accountName }: TabNavigationProps) {
  return (
    <Suspense
      fallback={
        <div className="border-b" style={{ background: 'var(--paper)', borderColor: 'var(--border)' }}>
          <div className="h-10" />
        </div>
      }
    >
      <TabNavigationContent accountName={accountName} />
    </Suspense>
  )
}
