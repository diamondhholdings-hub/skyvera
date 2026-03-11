'use client'

/**
 * StatusCycleButton — Cycles through statuses on click with optimistic updates.
 * Calls the appropriate API endpoint based on `type` ('pain-point' or 'action').
 * Shows a loading spinner while saving; reverts on error with a toast-style message.
 */

import { useState } from 'react'

interface StatusCycleButtonProps {
  id: string
  status: string
  statuses: string[]
  accountName: string
  type: 'pain-point' | 'action'
  onUpdate?: (newStatus: string) => void
}

// Color map for pain point statuses
const PAIN_POINT_COLORS: Record<string, string> = {
  active: 'bg-[var(--critical,#c62828)] text-white',
  monitoring: 'bg-[var(--warning,#e65100)] text-white',
  resolved: 'bg-[var(--success,#2e7d32)] text-white',
}

// Color map for action statuses
const ACTION_COLORS: Record<string, string> = {
  todo: 'bg-[var(--muted,#8b8b8b)] text-white',
  'in-progress': 'bg-[#1565c0] text-white',
  done: 'bg-[var(--success,#2e7d32)] text-white',
}

function getBadgeClass(status: string, type: 'pain-point' | 'action'): string {
  const map = type === 'pain-point' ? PAIN_POINT_COLORS : ACTION_COLORS
  return map[status] ?? 'bg-[var(--muted,#8b8b8b)] text-white'
}

export function StatusCycleButton({
  id,
  status,
  statuses,
  accountName,
  type,
  onUpdate,
}: StatusCycleButtonProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClick = async () => {
    if (isSaving) return

    // Determine next status in the cycle
    const currentIndex = statuses.indexOf(currentStatus)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]

    // Optimistic update
    const previousStatus = currentStatus
    setCurrentStatus(nextStatus)
    setErrorMsg(null)
    setIsSaving(true)

    try {
      const encodedName = encodeURIComponent(accountName)
      const endpoint =
        type === 'pain-point'
          ? `/api/account-plan/${encodedName}/pain-points/${id}`
          : `/api/account-plan/${encodedName}/actions/${id}`

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`)
      }

      // Notify parent
      onUpdate?.(nextStatus)
    } catch (error) {
      // Revert on failure
      setCurrentStatus(previousStatus)
      setErrorMsg(error instanceof Error ? error.message : 'Save failed')

      // Auto-clear error after 3 seconds
      setTimeout(() => setErrorMsg(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const badgeClass = getBadgeClass(currentStatus, type)

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isSaving}
        title={`Click to cycle status (current: ${currentStatus})`}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold
          uppercase tracking-wide cursor-pointer select-none
          transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60
          ${badgeClass}
        `}
      >
        {isSaving ? (
          <>
            {/* Loading spinner */}
            <svg
              className="w-3 h-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{currentStatus}</span>
          </>
        ) : (
          <span>{currentStatus}</span>
        )}
      </button>

      {/* Toast-style error message */}
      {errorMsg && (
        <span
          role="alert"
          className="absolute top-full mt-1 left-0 z-50 whitespace-nowrap text-[10px] font-medium text-white bg-[var(--critical,#c62828)] px-2 py-0.5 rounded shadow-md"
        >
          {errorMsg}
        </span>
      )}
    </div>
  )
}
