'use client'

import { CircleAlert } from 'lucide-react'
import Link from 'next/link'

/**
 * Error boundary for accounts list route
 */
export default function AccountsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Accounts error:', error)

  // Detect error type
  const errorMessage = error.message.toLowerCase()
  let userMessage = 'Something went wrong while loading accounts.'

  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    userMessage = 'High demand right now. Please wait a moment and try again.'
  } else if (errorMessage.includes('timeout') || errorMessage.includes('claude')) {
    userMessage = 'Data temporarily unavailable. Please try again in a moment.'
  } else if (errorMessage.includes('econnrefused') || errorMessage.includes('fetch')) {
    userMessage = 'Service temporarily offline. Please try again shortly.'
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="alert-box alert-critical flex max-w-2xl items-start gap-3" role="alert">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="m-0 text-base font-semibold" style={{ color: 'inherit' }}>
            Unable to load accounts
          </h1>
          <p className="m-0 mt-1 text-sm">{userMessage}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="btn btn-primary">
              Try again
            </button>
            <Link href="/dashboard" className="btn">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
