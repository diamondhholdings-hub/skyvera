/**
 * Query Input Component
 * Free-form natural language query input with submit and clear
 */

'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'
import { Loader2, Search, X } from 'lucide-react'

interface QueryInputProps {
  onSubmit: (query: string) => void
  isLoading: boolean
}

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed.length >= 3 && !isLoading) {
      onSubmit(trimmed)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const handleClear = () => {
    setInputValue('')
  }

  const isValid = inputValue.trim().length >= 3

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--muted)' }}
            aria-hidden="true"
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about revenue, margins, customers or business units"
            aria-label="Natural language query input"
            className="input pl-9 pr-9 disabled:cursor-not-allowed disabled:opacity-60"
            maxLength={500}
          />

          {inputValue.length > 0 && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="query-clear absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center"
              style={{ borderRadius: 'var(--radius-xs)' }}
              aria-label="Clear input"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <button type="submit" disabled={!isValid || isLoading} className="btn btn-primary h-9 shrink-0 px-4">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Asking</span>
            </>
          ) : (
            'Ask'
          )}
        </button>
      </div>

      {/* Character counter */}
      {inputValue.length > 0 && (
        <div className="mt-1 text-right text-xs" style={{ color: 'var(--muted)' }}>
          <span className="num">{inputValue.length}/500</span> characters
          {inputValue.trim().length < 3 && inputValue.trim().length > 0 && (
            <span className="ml-2" style={{ color: 'var(--critical-ink)' }}>Minimum 3 characters</span>
          )}
        </div>
      )}

      <style>{`
        .query-clear { color: var(--muted); transition: color 150ms, background-color 150ms; }
        .query-clear:hover { color: var(--ink); background: var(--surface-2); }
      `}</style>
    </form>
  )
}
