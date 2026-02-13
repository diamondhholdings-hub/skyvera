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
  MessageSquare
} from 'lucide-react'

/**
 * NavBar - Top navigation bar with Skyvera branding and icon-based navigation
 * Client Component because it uses usePathname() for active link highlighting
 * Editorial theme: dark ink background, accent logo, paper text
 */
export function NavBar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/accounts', label: 'Accounts', icon: Building2 },
    { href: '/alerts', label: 'Alerts', icon: Bell },
    { href: '/scenario', label: 'Scenarios', icon: GitBranch },
    { href: '/dm-strategy', label: 'DM Strategy', icon: TrendingUp },
    { href: '/query', label: 'Ask', icon: MessageSquare },
  ]

  return (
    <nav className="bg-ink border-b border-ink mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <Image
                src="/skyvera-logo.png"
                alt="Skyvera"
                width={160}
                height={36}
                className="h-7 w-auto"
                priority
              />
              <div className="text-xs text-paper/60 hidden lg:block border-l border-paper/20 pl-3">
                Intelligence Platform
              </div>
            </Link>
          </div>

          {/* Navigation Icons */}
          <div className="flex space-x-4">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              const Icon = link.icon

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`p-2.5 rounded-md transition-all hover:scale-105 ${
                    isActive
                      ? 'bg-white/10 text-accent'
                      : 'text-paper/70 hover:text-paper hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
