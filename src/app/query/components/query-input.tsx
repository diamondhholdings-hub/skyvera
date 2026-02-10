/**
 * Query Input Component
 * Free-form natural language query input with submit and clear
 */

'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'

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
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Ask anything about your business data..."
          aria-label="Natural language query input"
          className="w-full px-6 py-4 pr-24 text-lg border-2 border-[var(--border)] rounded-lg
                     focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]
                     disabled:bg-[var(--highlight)] disabled:cursor-not-allowed"
          maxLength={500}
        />

        {/* Clear button */}
        {inputValue.length > 0 && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 -translate-y-1/2
                       text-slate-400 hover:text-slate-600
                       transition-colors"
            aria-label="Clear input"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     px-4 py-1.5 bg-[var(--accent)] text-white rounded-md
                     hover:bg-[var(--accent)]/90 disabled:bg-[var(--muted)]
                     disabled:cursor-not-allowed
                     transition-colors
                     flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Thinking...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-sm">Ask</span>
            </>
          )}
        </button>
      </div>

      {/* Character counter */}
      {inputValue.length > 0 && (
        <div className="mt-1 text-xs text-slate-500 text-right">
          {inputValue.length}/500 characters
          {inputValue.trim().length < 3 && inputValue.trim().length > 0 && (
            <span className="text-red-500 ml-2">Minimum 3 characters</span>
          )}
        </div>
      )}
    </form>
  )
}
