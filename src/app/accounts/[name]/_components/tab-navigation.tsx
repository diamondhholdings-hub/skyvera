'use client'

/**
 * TabNavigation - URL-based tab navigation for account plan pages
 * Client Component - uses useSearchParams for active state
 * Telstra-style: sticky horizontal tab bar with accent bottom border
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
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'key-executives', icon: '👔', label: 'Key Executives' },
  { id: 'org-structure', icon: '🏢', label: 'Org Structure' },
  { id: 'pain-points', icon: '💡', label: 'Pain Points' },
  { id: 'competitive', icon: '⚔️', label: 'Competitive' },
  { id: 'action-plan', icon: '📋', label: 'Action Plan' },
  { id: 'financials', icon: '💰', label: 'Financial' },
  { id: 'intelligence', icon: '🧠', label: 'Intelligence' },
]

function TabNavigationContent({ accountName }: TabNavigationProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'

  return (
    <nav
      aria-label="Account sections"
      style={{
        background: 'white',
        borderBottom: '2px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Component-scoped styles for hover/focus — replaces JS hover handlers
          and provides a visible focus ring for keyboard users (WCAG 2.4.7). */}
      <style>{`
        .account-tab-link {
          flex-shrink: 0;
          padding: 1.25rem 2rem;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          border-bottom: 3px solid transparent;
          color: var(--muted);
          background: transparent;
          text-decoration: none;
          transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .account-tab-link:hover,
        .account-tab-link:focus-visible {
          color: var(--secondary);
          background: var(--highlight);
        }
        .account-tab-link:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }
        .account-tab-link[aria-current="page"] {
          /* Use accent-hover (#A83A22) for ~5.6:1 contrast vs --paper (WCAG 1.4.3 AA). */
          color: var(--accent-hover);
          background: var(--paper);
          border-bottom-color: var(--accent-hover);
        }
        .account-tab-link[aria-current="page"]:hover,
        .account-tab-link[aria-current="page"]:focus-visible {
          color: var(--accent-hover);
          background: var(--paper);
        }
      `}</style>
      <div style={{ display: 'flex', overflowX: 'auto', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        {TABS.map(({ id, icon, label }) => {
          const isActive = activeTab === id
          return (
            <Link
              key={id}
              href={`/accounts/${accountName}?tab=${id}`}
              scroll={false}
              prefetch={false}
              className="account-tab-link"
              aria-current={isActive ? 'page' : undefined}
            >
              <span aria-hidden="true">{icon}</span> {label}
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
        <div style={{ background: 'white', borderBottom: '2px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ height: '3.75rem', background: 'var(--highlight)', opacity: 0.4 }} />
        </div>
      }
    >
      <TabNavigationContent accountName={accountName} />
    </Suspense>
  )
}
