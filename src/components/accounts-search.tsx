'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * AccountsSearch — URL-driven search bar for the accounts list page.
 * Reads ?search= from URL params and updates the URL on input (debounced 200ms).
 */
export function AccountsSearch() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('search') ?? ''
  const [value, setValue] = useState(initialQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local value if URL changes externally
  useEffect(() => {
    setValue(searchParams.get('search') ?? '')
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.trim()) {
        params.set('search', next.trim())
      } else {
        params.delete('search')
      }
      router.replace(`?${params.toString()}`)
    }, 200)
  }

  const handleClear = () => {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    router.replace(`?${params.toString()}`)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Search icon */}
      <svg
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--muted)',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="search"
        name="search"
        value={value}
        onChange={handleChange}
        placeholder="Search accounts by name, BU, or health..."
        aria-label="Search accounts"
        style={{
          width: '100%',
          padding: '0.75rem 1rem 0.75rem 2.5rem',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-body)',
          color: 'var(--ink)',
          outline: 'none',
          boxSizing: 'border-box',
          paddingRight: value ? '2.5rem' : '1rem',
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            minWidth: '24px',
            minHeight: '24px',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
