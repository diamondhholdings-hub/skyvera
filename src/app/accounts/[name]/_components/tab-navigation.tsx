'use client'

/**
 * TabNavigation - URL-based tab navigation for account plan pages
 * Client Component - uses useSearchParams and useRouter
 * Desktop: Horizontal tab bar with active state
 * Mobile: Dropdown select for space efficiency
 */

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

interface TabNavigationProps {
  accountName: string // URL-encoded customer name
}

const tabs = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'organization', label: '🏢 Organization' },
  { id: 'strategy', label: '💡 Strategy & Pain Points' },
  { id: 'competitive', label: '⚔️ Competitive' },
  { id: 'action-items', label: '📋 Action Plan' },
  { id: 'financials', label: '💰 Financial' },
  { id: 'intelligence', label: '🔍 Intelligence' },
] as const

function TabNavigationContent({ accountName }: TabNavigationProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'overview'

  const handleTabChange = (tabId: string) => {
    router.push(`/accounts/${accountName}?tab=${tabId}`, { scroll: false })
  }

  return (
    <>
      {/* Desktop: Horizontal tab bar */}
      <div className="hidden md:block sticky top-0 z-50 bg-white border-b-2 border-[var(--border)] shadow-sm">
        <nav className="max-w-[1400px] mx-auto px-8 flex overflow-x-auto" aria-label="Account tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-5 px-6 border-b-3 border-transparent font-medium text-muted whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-accent border-accent bg-accent/5'
                  : 'hover:text-secondary hover:bg-highlight'
              }`}
              style={{
                borderBottomWidth: activeTab === tab.id ? '3px' : '3px',
                borderBottomColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile: Dropdown select */}
      <div className="md:hidden mb-6 px-8">
        <label htmlFor="tab-select" className="sr-only">
          Select tab
        </label>
        <select
          id="tab-select"
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
          className="w-full px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-white focus:border-accent focus:ring-accent"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

export function TabNavigation({ accountName }: TabNavigationProps) {
  return (
    <Suspense
      fallback={
        <div className="sticky top-0 z-50 bg-white border-b-2 border-[var(--border)] shadow-sm">
          <div className="h-16 animate-pulse bg-highlight/50"></div>
        </div>
      }
    >
      <TabNavigationContent accountName={accountName} />
    </Suspense>
  )
}
