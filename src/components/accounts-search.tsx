'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

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
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: 'var(--muted)' }}
        aria-hidden="true"
      />
      <input
        type="search"
        name="search"
        value={value}
        onChange={handleChange}
        placeholder="Search by name, business unit or health"
        aria-label="Search accounts"
        className="input [&::-webkit-search-cancel-button]:appearance-none"
        style={{ paddingLeft: '2.25rem', paddingRight: value ? '2.25rem' : undefined }}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2"
          style={{ padding: '0 0.375rem' }}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
