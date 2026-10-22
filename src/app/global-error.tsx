'use client'

/**
 * Global error boundary for catastrophic failures
 * Must include html and body tags per Next.js requirement. It replaces the root
 * layout, so it imports the global stylesheet itself to get tokens and .btn.
 */
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Global error:', error)

  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0, background: 'var(--paper)', color: 'var(--ink)' }}>
        <div className="mx-auto max-w-[1400px] px-4 py-16 lg:px-8">
          <div className="max-w-xl">
            <h1 className="m-0">Something went wrong</h1>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              The application ran into an unexpected problem. Try again, or go back to the overview.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={reset} className="btn btn-primary">
                Try again
              </button>
              {/* Plain anchor: a full reload is the safest recovery when the root layout failed */}
              <a href="/dashboard" className="btn">
                Back to Overview
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
