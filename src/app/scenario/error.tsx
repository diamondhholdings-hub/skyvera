'use client'

import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Error boundary for scenario planning route
 */
export default function ScenarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Scenario error:', error)

  // Detect error type
  const errorMessage = error.message.toLowerCase()
  let userMessage = 'Something went wrong while loading scenarios.'

  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    userMessage = 'Too many requests right now. Wait a moment and try again.'
  } else if (errorMessage.includes('timeout') || errorMessage.includes('claude')) {
    userMessage = 'Scenario analysis is temporarily unavailable. Try again in a moment.'
  } else if (errorMessage.includes('econnrefused') || errorMessage.includes('fetch')) {
    userMessage = 'The service is temporarily offline. Try again shortly.'
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <div className="alert-box alert-critical flex max-w-2xl items-start gap-3" role="alert">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="m-0 text-base font-semibold">Unable to load scenarios</h1>
            <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>{userMessage}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="btn btn-primary">
              Try again
            </button>
            <Link href="/dashboard" className="btn">
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
