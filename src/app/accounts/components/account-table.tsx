'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { AccountFilters } from './account-filters'
import { EmptyState } from '@/components/ui/empty-state'

interface AccountTableProps {
  customers: CustomerWithHealth[]
  completenessScores?: Record<string, number>
}

const PAGE_SIZE = 24

// Canonical business unit names, for matching ?bu= case-insensitively
const BU_OPTIONS = ['Cloudsense', 'Kandy', 'STL', 'NewNet']

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return value === 0 ? '—' : `$${value}`
}

/** Quiet inline meter: the table holds 99 rows, so a tinted badge per row is too loud */
function Completeness({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap" title={`Data completeness: ${clamped}%`}>
      <span
        aria-hidden="true"
        className="inline-block h-1 w-12 overflow-hidden"
        style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-xs)' }}
      >
        <span className="block h-full" style={{ width: `${clamped}%`, background: 'var(--secondary)' }} />
      </span>
      <span className="num text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>{clamped}% complete</span>
    </span>
  )
}

export function AccountTable({ customers, completenessScores = {} }: AccountTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'total', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 when filters or the (server-filtered) customer list change
  useEffect(() => { setCurrentPage(1) }, [customers, columnFilters])

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
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Business unit lives in the URL (?bu=), which the server page already
  // filters on, so a filtered view is bookmarkable and the control always
  // reflects it. Filtering it again client-side would run against the
  // already-filtered list and empty the table when switching units.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const handleBUFilter = (bu: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (bu === null) params.delete('bu')
    else params.set('bu', bu)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const handleHealthFilter = (health: string | null) => {
    setColumnFilters(prev => health === null
      ? prev.filter(f => f.id !== 'healthScore')
      : [...prev.filter(f => f.id !== 'healthScore'), { id: 'healthScore', value: health }]
    )
  }

  const urlBU = searchParams.get('bu')
  const activeBU = BU_OPTIONS.find(b => b.toLowerCase() === urlBU?.toLowerCase()) ?? null
  const activeHealth = columnFilters.find(f => f.id === 'healthScore')?.value as string | null

  const allRows = table.getRowModel().rows
  const totalPages = Math.ceil(allRows.length / PAGE_SIZE)
  const pageRows = allRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const isDesc = sorting[0]?.desc !== false

  return (
    <div className="space-y-4">
      {/* Toolbar: filters left, sort right */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AccountFilters
          onBUFilter={handleBUFilter}
          onHealthFilter={handleHealthFilter}
          activeBU={activeBU ?? null}
          activeHealth={activeHealth ?? null}
        />

        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="section-label">Sort by</span>
            <select
              value={sorting[0]?.id || 'total'}
              onChange={e => setSorting([{ id: e.target.value, desc: sorting[0]?.desc ?? true }])}
              className="input"
              style={{ width: 'auto', height: '2rem', paddingRight: '2rem', fontSize: '0.8125rem' }}
            >
              <option value="total">Total revenue</option>
              <option value="rr">ARR</option>
              <option value="customer_name">Name</option>
              <option value="healthScore">Health</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSorting([{ id: sorting[0]?.id || 'total', desc: !sorting[0]?.desc }])}
            aria-label={`Sort ${sorting[0]?.desc ? 'descending' : 'ascending'}, click to toggle`}
            aria-pressed={!!sorting[0]?.desc}
            className="btn"
            style={{ width: '2rem', padding: 0 }}
          >
            {isDesc
              ? <ArrowDown className="h-4 w-4" aria-hidden="true" />
              : <ArrowUp className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="m-0 text-[0.8125rem]" style={{ color: 'var(--muted)' }} aria-live="polite">
        <span className="num">{allRows.length}</span> accounts
        {allRows.length !== customers.length && <> (filtered from <span className="num">{customers.length}</span>)</>}
        {totalPages > 1 && <> · page <span className="num">{currentPage}</span> of <span className="num">{totalPages}</span></>}
      </p>

      {allRows.length === 0 ? (
        <EmptyState
          title="No accounts match these filters"
          description="Try a different business unit or health filter, or clear the search."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table account-list-table" style={{ minWidth: '760px' }}>
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Business unit</th>
                  <th scope="col">Health</th>
                  <th scope="col">Plan completeness</th>
                  <th scope="col" style={{ textAlign: 'right' }}>ARR</th>
                  <th scope="col" style={{ textAlign: 'right' }}>NRR</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const c = row.original
                  return (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/accounts/${encodeURIComponent(c.customer_name)}`}
                          className="account-card font-medium"
                        >
                          {c.customer_name}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--ink-2)' }}>{c.bu}</td>
                      <td><HealthIndicator score={c.healthScore} /></td>
                      <td><Completeness score={completenessScores[c.customer_name] ?? 0} /></td>
                      <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(c.rr)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(c.nrr)}</td>
                      <td className="num font-medium" style={{ textAlign: 'right' }}>{formatCurrency(c.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) => p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1" style={{ color: 'var(--muted)' }} aria-hidden="true">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p as number)}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
                className={`btn btn-sm num ${p === currentPage ? 'account-page-current' : 'btn-ghost'}`}
                style={{ minWidth: '1.75rem', padding: '0 0.5rem' }}
              >
                {p}
              </button>
            ))
          }

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-sm"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* Whole row is the click target: the name link stretches over its row */}
      <style>{`
        .account-list-table tbody tr { position: relative; }
        .account-list-table .account-card { color: var(--ink); text-decoration: none; }
        .account-list-table .account-card::after { content: ''; position: absolute; inset: 0; }
        .account-list-table tbody tr:hover .account-card { color: var(--secondary); text-decoration: underline; text-underline-offset: 2px; }
        .account-list-table .account-card:focus-visible { outline: none; }
        .account-list-table .account-card:focus-visible::after { outline: 2px solid var(--accent); outline-offset: -2px; }
        .account-page-current { border-color: var(--ink); font-weight: 600; }
      `}</style>
    </div>
  )
}
