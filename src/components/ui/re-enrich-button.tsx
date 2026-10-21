'use client'

/**
 * ReEnrichButton — small client component that calls POST /api/enrich
 * to re-run enrichment for an already-enriched account.
 * Shows loading state during request; reloads page on success.
 */

import { useState } from 'react'

interface ReEnrichButtonProps {
  customerName: string
}

export function ReEnrichButton({ customerName }: ReEnrichButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleReEnrich = async () => {
    setState('loading')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? `HTTP ${response.status}`)
      }

      // Success — hard reload to show fresh enrichment data
      window.location.reload()
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Re-enrichment failed')
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
      <button
        onClick={handleReEnrich}
        disabled={state === 'loading'}
        className="btn btn-sm"
      >
        {state === 'loading' ? (
          <>
            <svg
              style={{ width: '11px', height: '11px', animation: 're-enrich-spin 1s linear infinite' }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enriching…
          </>
        ) : (
          <>↻ Re-enrich</>
        )}
      </button>
      {state === 'error' && errorMessage && (
        <span style={{ fontSize: '0.7rem', color: 'var(--critical-ink)' }}>
          {errorMessage}
        </span>
      )}
      <style>{`@keyframes re-enrich-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
