'use client'

/**
 * RefreshButton - revalidates server data
 * Client Component because it uses useRouter and useState for interactivity
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface RefreshButtonProps {
  onRefresh?: () => Promise<void>
  label?: string
  /** Kept for compatibility; all headers are light now */
  variant?: 'default' | 'on-dark'
}

export function RefreshButton({ onRefresh, label = 'Refresh' }: RefreshButtonProps) {
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

  return (
    <button type="button" onClick={handleRefresh} disabled={isRefreshing} className="btn" aria-label={label} data-print="hide">
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
