'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * NavBar - Top navigation bar with Skyvera branding and page links
 * Client Component because it uses usePathname() for active link highlighting
 */
export function NavBar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/accounts', label: 'Accounts' },
    { href: '/alerts', label: 'Alerts' },
  ]

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-white">
                Skyvera
              </div>
              <div className="text-sm text-slate-400 hidden sm:block">
                Intelligence Platform
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
