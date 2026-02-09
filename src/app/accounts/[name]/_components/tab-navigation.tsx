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
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'organization', label: 'Organization' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'action-items', label: 'Action Items' },
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
      <div className="hidden md:block border-b border-slate-200 mb-6">
        <nav className="flex space-x-8" aria-label="Account tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile: Dropdown select */}
      <div className="md:hidden mb-6">
        <label htmlFor="tab-select" className="sr-only">
          Select tab
        </label>
        <select
          id="tab-select"
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="border-b border-slate-200 mb-6">
          <div className="h-14 animate-pulse bg-slate-100"></div>
        </div>
      }
    >
      <TabNavigationContent accountName={accountName} />
    </Suspense>
  )
}
