'use client'

/**
 * AccountTable - TanStack Table with sorting, filtering, search
 * Client Component - uses useReactTable for interactivity
 * Pattern from 02-RESEARCH.md Example 2
 */

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { CustomerWithHealth } from '@/lib/types/customer'
import { HealthIndicator } from '@/components/ui/health-indicator'
import { Badge } from '@/components/ui/badge'
import { AccountFilters } from './account-filters'

interface AccountTableProps {
  customers: CustomerWithHealth[]
}

export function AccountTable({ customers }: AccountTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')

  // Removed debug logging - issue was test selectors, not rendering

  // Debounce global filter with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [globalFilter])

  // Format currency helper
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${(value / 1000).toFixed(0)}K`
  }

  // Define columns
  const columns = useMemo<ColumnDef<CustomerWithHealth>[]>(
    () => [
      {
        accessorKey: 'customer_name',
        header: 'Customer Name',
        cell: (info) => (
          <Link
            href={`/accounts/${encodeURIComponent(info.getValue() as string)}`}
            className="font-semibold text-[var(--accent)] hover:text-[var(--accent)]/80 hover:underline"
          >
            {info.getValue() as string}
          </Link>
        ),
      },
      {
        accessorKey: 'bu',
        header: 'Business Unit',
        cell: (info) => <Badge variant="default">{info.getValue() as string}</Badge>,
        filterFn: 'equals',
      },
      {
        accessorKey: 'rr',
        header: 'Recurring Revenue',
        cell: (info) => (
          <span className="text-right block">{formatCurrency(info.getValue() as number)}</span>
        ),
      },
      {
        accessorKey: 'nrr',
        header: 'Non-Recurring Revenue',
        cell: (info) => (
          <span className="text-right block">{formatCurrency(info.getValue() as number)}</span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total Revenue',
        cell: (info) => (
          <span className="text-right block font-semibold">
            {formatCurrency(info.getValue() as number)}
          </span>
        ),
      },
      {
        id: 'arr',
        header: 'ARR',
        accessorFn: (row) => row.rr * 4,
        cell: (info) => (
          <span className="text-right block">{formatCurrency(info.getValue() as number)}</span>
        ),
      },
      {
        accessorKey: 'healthScore',
        header: 'Health',
        cell: (info) => <HealthIndicator score={info.getValue() as 'green' | 'yellow' | 'red'} />,
        filterFn: 'equals',
      },
    ],
    []
  )

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
      globalFilter: debouncedGlobalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setDebouncedGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase()
      const customerName = String(row.getValue('customer_name')).toLowerCase()
      return customerName.includes(searchValue)
    },
  })

  // Removed debug logging - issue was test selectors, not rendering

  // Filter handlers
  const handleBUFilter = (bu: string | null) => {
    if (bu === null) {
      setColumnFilters((prev) => prev.filter((f) => f.id !== 'bu'))
    } else {
      setColumnFilters((prev) => {
        const others = prev.filter((f) => f.id !== 'bu')
        return [...others, { id: 'bu', value: bu }]
      })
    }
  }

  const handleHealthFilter = (health: string | null) => {
    if (health === null) {
      setColumnFilters((prev) => prev.filter((f) => f.id !== 'healthScore'))
    } else {
      setColumnFilters((prev) => {
        const others = prev.filter((f) => f.id !== 'healthScore')
        return [...others, { id: 'healthScore', value: health }]
      })
    }
  }

  // Get active filter values
  const activeBU = columnFilters.find((f) => f.id === 'bu')?.value as string | null
  const activeHealth = columnFilters.find((f) => f.id === 'healthScore')?.value as string | null

  return (
    <div>
      {/* Search Input - Centered */}
      <div className="mb-6 flex justify-center animate-fade-in">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search customers by name..."
          className="w-full max-w-[600px] px-6 py-3 text-lg border-2 border-[var(--border)] rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
        />
      </div>

      {/* Filters */}
      <AccountFilters
        onBUFilter={handleBUFilter}
        onHealthFilter={handleHealthFilter}
        activeBU={activeBU ?? null}
        activeHealth={activeHealth ?? null}
      />

      {/* Sort Controls */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-ink">Sort by:</label>
        <select
          value={sorting[0]?.id || 'total'}
          onChange={(e) => {
            const columnId = e.target.value
            setSorting([{ id: columnId, desc: sorting[0]?.desc ?? true }])
          }}
          className="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        >
          <option value="total">Total Revenue</option>
          <option value="customer_name">Customer Name</option>
          <option value="healthScore">Health Score</option>
          <option value="rr">Recurring Revenue</option>
        </select>
        <button
          onClick={() => setSorting([{ id: sorting[0]?.id || 'total', desc: !sorting[0]?.desc }])}
          className="px-3 py-1.5 border border-[var(--border)] rounded text-sm hover:bg-highlight transition-colors button-press"
        >
          {sorting[0]?.desc ? '↓ Descending' : '↑ Ascending'}
        </button>
      </div>

      {/* Customer Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {table.getRowModel().rows.map((row, index) => {
          const customer = row.original
          return (
            <Link
              key={row.id}
              href={`/accounts/${encodeURIComponent(customer.customer_name)}`}
              className="bg-white border-2 border-[var(--border)] p-6 rounded-lg cursor-pointer card-hover relative block"
            >
              {/* Rank Badge */}
              <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded font-bold text-lg">
                #{index + 1}
              </div>

              {/* Customer Name */}
              <h3 className="font-display text-xl font-semibold text-secondary mb-4 pr-16">
                {customer.customer_name}
              </h3>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs uppercase text-muted mb-1">Total Revenue</p>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(customer.total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase text-muted mb-1">RR</p>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(customer.rr)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs uppercase text-muted mb-1">ARR</p>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(customer.rr * 4)}</p>
                </div>
              </div>

              {/* Bottom Row: BU Badge and Health Indicator */}
              <div className="flex items-center justify-between">
                <Badge variant="default">{customer.bu}</Badge>
                <HealthIndicator score={customer.healthScore} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-12 text-muted">
          No customers found matching your filters.
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-sm text-muted text-center">
        Showing {table.getRowModel().rows.length} of {customers.length} customers
      </div>
    </div>
  )
}
