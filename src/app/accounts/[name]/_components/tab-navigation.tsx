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
  { id: 'key-executives', label: '👔 Key Executives' },
  { id: 'org-structure', label: '🏢 Org Structure' },
  { id: 'pain-points', label: '💡 Pain Points' },
  { id: 'competitive', label: '⚔️ Competitive' },
  { id: 'action-plan', label: '📋 Action Plan' },
  { id: 'financials', label: '💰 Financial' },
  { id: 'intelligence', label: '🧠 Intelligence' },
]

function TabNavigationContent({ accountName }: TabNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  return (
    <nav
      style={{
        background: 'white',
        borderBottom: '2px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', overflowX: 'auto', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => router.push(`/accounts/${accountName}?tab=${id}`, { scroll: false })}
              style={{
                flexShrink: 0,
                padding: '1.25rem 2rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                background: isActive ? 'var(--paper)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.target as HTMLElement).style.color = 'var(--secondary)'
                  ;(e.target as HTMLElement).style.background = 'var(--highlight)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.target as HTMLElement).style.color = 'var(--muted)'
                  ;(e.target as HTMLElement).style.background = 'transparent'
                }
              }}
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
        <div style={{ background: 'white', borderBottom: '2px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ height: '3.75rem', background: 'var(--highlight)', opacity: 0.4 }} />
        </div>
      }
    >
      <TabNavigationContent accountName={accountName} />
    </Suspense>
  )
}
