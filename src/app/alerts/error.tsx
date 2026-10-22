'use client'

import { CircleX } from 'lucide-react'
import Link from 'next/link'

/**
 * Error boundary for alerts route
 */
export default function AlertsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Alerts error:', error)

  // Detect error type
  const errorMessage = error.message.toLowerCase()
  let userMessage = 'Something went wrong while loading alerts.'

  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    userMessage = 'High demand right now. Please wait a moment and try again.'
  } else if (errorMessage.includes('timeout') || errorMessage.includes('claude')) {
    userMessage = 'Data temporarily unavailable. Please try again in a moment.'
  } else if (errorMessage.includes('econnrefused') || errorMessage.includes('fetch')) {
    userMessage = 'Service temporarily offline. Please try again shortly.'
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="alert-box alert-critical flex max-w-xl items-start gap-3" role="alert">
        <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="m-0 text-base font-semibold">Unable to load alerts</h1>
          <p className="m-0 mt-1 text-sm">{userMessage}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="btn btn-sm">
              Try again
            </button>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
