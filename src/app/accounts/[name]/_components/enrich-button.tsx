'use client'

/**
 * EnrichButton — client component that calls POST /api/enrich for an account.
 * Shows a spinner while running, then refreshes the page to show new data.
 * Used inside the IntelligenceTab when no enrichment exists yet.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DatabaseZap, Loader2 } from 'lucide-react'

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
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleEnrich}
        disabled={state === 'loading'}
        className="btn btn-primary"
      >
        {state === 'loading'
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : <DatabaseZap className="h-4 w-4" aria-hidden="true" />}
        {state === 'loading' ? 'Enriching…' : 'Enrich account'}
      </button>
      {state === 'error' && errorMessage && (
        <span className="text-xs" role="alert" style={{ color: 'var(--critical-ink)' }}>
          {errorMessage}
        </span>
      )}
    </div>
  )
}
