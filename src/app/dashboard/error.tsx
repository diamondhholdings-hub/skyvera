'use client'

import { AlertCircle } from 'lucide-react'
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
  let userMessage = 'Something went wrong while loading the dashboard'

  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    userMessage = 'High demand right now. Please wait a moment and try again.'
  } else if (errorMessage.includes('timeout') || errorMessage.includes('claude')) {
    userMessage = 'Data temporarily unavailable. Please try again in a moment.'
  } else if (errorMessage.includes('econnrefused') || errorMessage.includes('fetch')) {
    userMessage = 'Service temporarily offline. Please try again shortly.'
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-50 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-yellow-500" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Unable to load dashboard
          </h1>
          <p className="text-sm text-gray-600">
            {userMessage}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
