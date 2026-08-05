'use client'

/**
 * RefreshButton - Button with refresh icon that revalidates server data
 * Client Component because it uses useRouter and useState for interactivity
 * Editorial theme: muted text with ink hover
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RefreshButtonProps {
  onRefresh?: () => Promise<void>
  label?: string
  /** Visual variant. 'on-dark' uses white-tinted text for dark backgrounds (e.g. PageHeader gradient). */
  variant?: 'default' | 'on-dark'
}

export function RefreshButton({ onRefresh, label = 'Refresh', variant = 'default' }: RefreshButtonProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      if (onRefresh) {
        await onRefresh()
      }
      router.refresh() // Revalidate server components
    } finally {
      setIsRefreshing(false)
    }
  }

  const colorClasses =
    variant === 'on-dark'
      ? 'text-white/85 hover:text-white'
      : 'text-muted hover:text-ink'

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center gap-2 text-sm ${colorClasses} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      aria-label={label}
    >
      <svg
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
