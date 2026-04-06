'use client'

/**
 * ErrorBoundary — reusable React class-based error boundary.
 *
 * React error boundaries must be class components (React 19 still requires this).
 * Catches render-time errors in the subtree and renders a fallback UI.
 *
 * Exports:
 *  - ErrorBoundary           — class component, use directly
 *  - withErrorBoundary(C, f) — HOC convenience wrapper
 */

import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  /** Fallback UI to render when a child throws. */
  fallback?: React.ReactNode
  /**
   * Optional callback invoked with the error and React's error info.
   * Use this for logging to an external service (e.g. Sentry).
   */
  onError?: (error: Error, info: React.ErrorInfo) => void
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ─── Default fallback UI ──────────────────────────────────────────────────────

function DefaultFallback({ error }: { error: Error | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-800/40 bg-neutral-800/60 px-6 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/40">
        {/* Exclamation icon — inline SVG avoids any import issues */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-red-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-100">Something went wrong</p>
        {error?.message && (
          <p className="mt-1 max-w-xs text-xs text-neutral-400">{error.message}</p>
        )}
      </div>
    </div>
  )
}

// ─── ErrorBoundary class ──────────────────────────────────────────────────────

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info)
    // Always log to console so errors are visible in dev/prod logs
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// ─── HOC convenience wrapper ──────────────────────────────────────────────────

/**
 * Wraps `Component` in an ErrorBoundary with the given `fallback`.
 *
 * @example
 * const SafeChat = withErrorBoundary(AccountChatPanel, <p>Chat unavailable</p>)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
): React.FC<P> {
  const displayName = Component.displayName ?? Component.name ?? 'Component'

  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`
  return WrappedComponent
}
