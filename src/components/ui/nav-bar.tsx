'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Bell,
  GitBranch,
  TrendingUp,
  MessageSquare,
} from 'lucide-react'

const links = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/accounts',     label: 'Accounts',     icon: Building2 },
  { href: '/alerts',       label: 'Alerts',       icon: Bell },
  { href: '/dm-strategy',  label: 'DM Strategy',  icon: TrendingUp },
  { href: '/scenario',     label: 'Scenarios',    icon: GitBranch },
  { href: '/query',        label: 'Ask',          icon: MessageSquare },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        background: 'var(--nav-bg)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="px-4 lg:px-8"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          gap: '8px',
        }}
      >
        {/* Brand */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Image
            src="/skyvera-logo.png"
            alt="Skyvera"
            width={120}
            height={28}
            style={{ height: '22px', width: 'auto', opacity: 0.95 }}
            priority
          />
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(148,163,184,0.5)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              paddingLeft: '12px',
              fontFamily: 'var(--font-body)',
              display: 'var(--_hide, block)',
            }}
            className="hidden lg:block"
          >
            Intelligence
          </span>
        </Link>

        {/* Navigation Links — horizontally scrollable on narrow viewports
            instead of forcing the whole page to scroll sideways */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            minWidth: 0,
          }}
        >
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(link.href + '/')
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  flexShrink: 0,
                  borderRadius: '6px 6px 0 0',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  transition: 'all 0.15s ease',
                  color: isActive
                    ? '#FFFFFF'
                    : 'rgba(148,163,184,0.8)',
                  background: isActive
                    ? 'rgba(255,255,255,0.08)'
                    : 'transparent',
                  borderBottom: isActive
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  marginBottom: '-1px',
                }}
                className="nav-link"
              >
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    color: isActive ? 'var(--accent)' : 'inherit',
                    flexShrink: 0,
                  }}
                />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right side — live indicator. display intentionally omitted from
            the inline style so the "hidden lg:flex" classes control
            visibility — an inline display value would always win over the
            Tailwind classes and defeat the mobile hidden state. */}
        <div
          style={{
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.7rem',
            color: 'rgba(100,116,139,0.7)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
          className="hidden lg:flex"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px rgba(16,185,129,0.6)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          Live
        </div>
      </div>

      <style>{`
        .nav-link:hover {
          color: #E2E8F0 !important;
          background: rgba(255,255,255,0.05) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </nav>
  )
}
