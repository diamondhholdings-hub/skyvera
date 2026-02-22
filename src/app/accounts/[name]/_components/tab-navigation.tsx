'use client'

/**
 * TabNavigation - URL-based tab navigation for account plan pages
 * Client Component - uses useSearchParams and useRouter
 * Telstra-style: sticky horizontal tab bar with accent bottom border
 */

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

interface TabNavigationProps {
  accountName: string // URL-encoded customer name
}

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'financials', label: '💰 Financials' },
  { id: 'strategy', label: '🎯 Strategy' },
  { id: 'competitive', label: '⚔️ Competitive' },
  { id: 'organization', label: '🏢 Organization' },
  { id: 'intelligence', label: '🧠 Intelligence' },
  { id: 'action-items', label: '✅ Action Items' },
]

function TabNavigationContent({ accountName }: TabNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  return (
    <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => router.push(`/accounts/${accountName}?tab=${id}`, { scroll: false })}
              className={`
                flex-shrink-0 px-6 py-4 text-sm font-semibold whitespace-nowrap
                border-b-[3px] transition-all
                ${isActive
                  ? 'border-b-[var(--accent)] text-[var(--accent)] bg-[var(--highlight)]'
                  : 'border-b-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--highlight)]/50'
                }
              `}
            >
              {label}
            </button>
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
        <div className="bg-white border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
          <div className="h-14 animate-pulse bg-[var(--highlight)]/50" />
        </div>
      }
    >
      <TabNavigationContent accountName={accountName} />
    </Suspense>
  )
}
