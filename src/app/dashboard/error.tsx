'use client'

import { CircleAlert, RotateCw } from 'lucide-react'
import Link from 'next/link'

/**
 * Error boundary for dashboard route
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Dashboard error:', error)

  // Detect error type
  const errorMessage = error.message.toLowerCase()
  let userMessage = 'Something went wrong while loading the dashboard.'

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
        <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="m-0 text-base" style={{ color: 'inherit' }}>
            Unable to load dashboard
          </h1>
          <p className="m-0 mt-1 text-sm">{userMessage}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="btn btn-primary">
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
            <Link href="/" className="btn">
              Go to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
