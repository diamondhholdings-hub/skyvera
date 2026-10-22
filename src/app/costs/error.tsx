'use client'

import { CircleX } from 'lucide-react'
import Link from 'next/link'

/**
 * Error boundary for the costs route
 */
export default function CostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Costs error:', error)

  const errorMessage = error.message.toLowerCase()
  let userMessage = 'Something went wrong while loading cost data.'

  if (errorMessage.includes('enoent') || errorMessage.includes('json')) {
    userMessage = 'The cost snapshot could not be read. Regenerate it with npm run refresh-data.'
  } else if (errorMessage.includes('timeout')) {
    userMessage = 'Data temporarily unavailable. Please try again in a moment.'
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="alert-box alert-critical flex max-w-xl items-start gap-3" role="alert">
        <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <h1 className="m-0 text-base font-semibold">Unable to load costs</h1>
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
