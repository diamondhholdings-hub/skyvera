'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { CustomerWithHealth } from '@/lib/types/customer'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { Badge } from '@/components/ui/badge'
import { AccountFilters } from './account-filters'
import { CompletenessBadge } from '@/components/completeness-badge'

interface AccountTableProps {
  customers: CustomerWithHealth[]
  completenessScores?: Record<string, number>
}

const PAGE_SIZE = 24

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return value === 0 ? '—' : `$${value}`
}

export function AccountTable({ customers, completenessScores = {} }: AccountTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [debouncedFilter, setDebouncedFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(globalFilter), 300)
    return () => clearTimeout(t)
  }, [globalFilter])

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1) }, [debouncedFilter, columnFilters])

  const columns = useMemo<ColumnDef<CustomerWithHealth>[]>(() => [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'bu', header: 'BU', filterFn: 'equals' },
    { accessorKey: 'rr', header: 'ARR' },
    { accessorKey: 'nrr', header: 'NRR' },
    { accessorKey: 'total', header: 'Total' },
    {
      accessorKey: 'healthScore',
      header: 'Health',
      filterFn: (row, columnId, filterValue) => {
        const health = row.getValue(columnId) as string
        if (filterValue === 'at-risk') return health === 'yellow' || health === 'red'
        return health === filterValue
      },
    },
  ], [])

  const table = useReactTable({
    data: customers,
    columns,
    state: { sorting, globalFilter: debouncedFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setDebouncedFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _, filterValue) => {
      return String(row.getValue('customer_name')).toLowerCase().includes(filterValue.toLowerCase())
    },
  })

  const handleBUFilter = (bu: string | null) => {
    setColumnFilters(prev => bu === null
      ? prev.filter(f => f.id !== 'bu')
      : [...prev.filter(f => f.id !== 'bu'), { id: 'bu', value: bu }]
    )
  }

  const handleHealthFilter = (health: string | null) => {
    setColumnFilters(prev => health === null
      ? prev.filter(f => f.id !== 'healthScore')
      : [...prev.filter(f => f.id !== 'healthScore'), { id: 'healthScore', value: health }]
    )
  }

  const activeBU = columnFilters.find(f => f.id === 'bu')?.value as string | null
  const activeHealth = columnFilters.find(f => f.id === 'healthScore')?.value as string | null

  const allRows = table.getRowModel().rows
  const totalPages = Math.ceil(allRows.length / PAGE_SIZE)
  const pageRows = allRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      {/* Search + Sort row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search accounts..."
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '10px',
              paddingBottom: '10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              color: 'var(--ink)',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Sort</span>
          <select
            value={sorting[0]?.id || 'total'}
            onChange={e => setSorting([{ id: e.target.value, desc: sorting[0]?.desc ?? true }])}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-body)',
              color: 'var(--ink)',
              background: '#fff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="total">Total Revenue</option>
            <option value="rr">ARR</option>
            <option value="customer_name">Name</option>
            <option value="healthScore">Health</option>
          </select>
          <button
            onClick={() => setSorting([{ id: sorting[0]?.id || 'total', desc: !sorting[0]?.desc }])}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-body)',
              color: 'var(--ink)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {sorting[0]?.desc !== false ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <AccountFilters
        onBUFilter={handleBUFilter}
        onHealthFilter={handleHealthFilter}
        activeBU={activeBU ?? null}
        activeHealth={activeHealth ?? null}
      />

      {/* Results count */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: '16px' }}>
        {allRows.length} accounts
        {allRows.length !== customers.length && ` (filtered from ${customers.length})`}
        {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
      </div>

      {/* Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {pageRows.map((row, idx) => {
          const c = row.original
          const globalRank = (currentPage - 1) * PAGE_SIZE + idx + 1
          const healthColor = c.healthScore === 'red' ? 'var(--critical)' : c.healthScore === 'yellow' ? 'var(--warning)' : 'var(--success)'

          return (
            <Link
              key={row.id}
              href={`/accounts/${encodeURIComponent(c.customer_name)}`}
              style={{
                display: 'block',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px',
                textDecoration: 'none',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="account-card"
            >
              {/* Health accent bar */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '3px',
                background: healthColor,
              }} />

              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: 0,
                  lineHeight: 1.3,
                  flex: 1,
                  paddingRight: '12px',
                }}>
                  {c.customer_name}
                </h3>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  flexShrink: 0,
                }}>
                  #{globalRank}
                </span>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'Total', value: formatCurrency(c.total) },
                  { label: 'ARR', value: formatCurrency(c.rr) },
                  { label: 'NRR', value: formatCurrency(c.nrr) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px', fontFamily: 'var(--font-body)' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--accent)',
                  background: 'rgba(200,75,49,0.08)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}>
                  {c.bu}
                </span>
                <CompletenessBadge score={completenessScores[c.customer_name] ?? 0} />
                <HealthIndicator score={c.healthScore} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {allRows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
          No accounts match your filters.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              background: currentPage === 1 ? 'var(--paper)' : '#fff',
              color: currentPage === 1 ? 'var(--muted)' : 'var(--ink)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) => p === '…' ? (
              <span key={`ellipsis-${i}`} style={{ color: 'var(--muted)', padding: '0 4px' }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p as number)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid',
                  borderColor: p === currentPage ? 'var(--accent)' : 'var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)',
                  background: p === currentPage ? 'var(--accent)' : '#fff',
                  color: p === currentPage ? '#fff' : 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: p === currentPage ? 700 : 400,
                  minWidth: '36px',
                }}
              >
                {p}
              </button>
            ))
          }

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              background: currentPage === totalPages ? 'var(--paper)' : '#fff',
              color: currentPage === totalPages ? 'var(--muted)' : 'var(--ink)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}

      <style>{`
        .account-card:hover {
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px) !important;
        }
      `}</style>
    </div>
  )
}
