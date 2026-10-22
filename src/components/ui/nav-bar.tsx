'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard',   label: 'Overview' },
  { href: '/accounts',    label: 'Accounts' },
  { href: '/revenue-risk', label: 'Revenue risk' },
  { href: '/costs',       label: 'Costs' },
  { href: '/dm-strategy', label: 'Retention' },
  { href: '/scenario',    label: 'Scenarios' },
  { href: '/alerts',      label: 'Alerts' },
  { href: '/query',       label: 'Ask' },
]

interface NavBarProps {
  /** Quarter label of the loaded budget snapshot, e.g. "Q4 2026" */
  fiscalQuarter?: string | null
}

export function NavBar({ fiscalQuarter }: NavBarProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center" aria-label="Skyvera overview">
          <Image
            src="/skyvera-logo.png"
            alt="Skyvera"
            width={120}
            height={28}
            style={{ height: '20px', width: 'auto' }}
            priority
          />
        </Link>

        {/* Links scroll inside their own strip on narrow viewports instead of
            pushing the page sideways */}
        <div className="flex h-full min-w-0 flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none]">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className="nav-link"
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {fiscalQuarter && (
          <span className="hidden shrink-0 text-[0.8125rem] lg:inline" style={{ color: 'var(--muted)' }}>
            Data: {fiscalQuarter} budget
          </span>
        )}
      </div>

      <style>{`
        .nav-link {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          padding: 0 0.625rem;
          margin-bottom: -1px;
          border-bottom: 2px solid transparent;
          color: var(--nav-text);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: color 150ms var(--ease-out), border-color 150ms var(--ease-out);
        }
        .nav-link:hover { color: var(--nav-text-active); }
        .nav-link[aria-current="page"] {
          color: var(--nav-text-active);
          border-bottom-color: var(--accent);
        }
      `}</style>
    </nav>
  )
}
