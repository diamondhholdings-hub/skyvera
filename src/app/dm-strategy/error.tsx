'use client'

/**
 * Error boundary for the revenue retention page
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { CircleX } from 'lucide-react'

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
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="alert-box alert-critical flex max-w-xl items-start gap-3" role="alert">
        <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="m-0 text-base font-semibold">Something went wrong</h1>
          <p className="m-0 mt-1 text-sm">
            Failed to load revenue retention. This might be a temporary issue.
          </p>
          <p className="m-0 mt-1 break-words text-sm" style={{ color: 'var(--ink-2)' }}>
            {error.message || 'Unknown error'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="btn btn-sm">
              Try again
            </button>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
