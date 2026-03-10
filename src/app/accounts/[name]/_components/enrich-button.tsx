'use client'

/**
 * EnrichButton — client component that calls POST /api/enrich for an account.
 * Shows a spinner while running, then refreshes the page to show new data.
 * Used inside the IntelligenceTab when no enrichment exists yet.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EnrichButtonProps {
  customerName: string
}

export function EnrichButton({ customerName }: EnrichButtonProps) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleEnrich = async () => {
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

      // Success — refresh server components to show new enrichment data
      router.refresh()
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Enrichment failed')
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
      <button
        onClick={handleEnrich}
        disabled={state === 'loading'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1.25rem',
          background: state === 'loading' ? 'var(--muted)' : 'var(--secondary)',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          opacity: state === 'loading' ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {state === 'loading' && (
          <svg
            style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {state === 'loading' ? 'Enriching…' : 'Enrich Account'}
      </button>
      {state === 'error' && errorMessage && (
        <span style={{ fontSize: '0.75rem', color: 'var(--critical, #dc2626)' }}>
          {errorMessage}
        </span>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
