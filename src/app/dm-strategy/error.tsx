'use client'

/**
 * Error boundary for DM Strategy page
 */

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('DM Strategy page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-red-200 shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[var(--critical)] mb-3">
            Something went wrong
          </h2>
          <p className="text-[var(--muted)] mb-6">
            Failed to load DM Strategy page. This might be a temporary issue.
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-800 break-words">
              {error.message || 'Unknown error'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <a
              href="/dashboard"
              className="flex-1 py-3 bg-slate-100 text-[var(--ink)] font-semibold rounded-lg hover:bg-slate-200 transition-colors text-center"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
