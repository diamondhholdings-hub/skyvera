'use client'

/**
 * AccountTable - TanStack Table with sorting, filtering, search
 * Client Component - uses useReactTable for interactivity
 * Pattern from 02-RESEARCH.md Example 2
 */

import { useState, useEffect, useMemo } from 'react'
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
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
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
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search customers by name..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters */}
      <AccountFilters
        onBUFilter={handleBUFilter}
        onHealthFilter={handleHealthFilter}
        activeBU={activeBU ?? null}
        activeHealth={activeHealth ?? null}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-blue-500">
                          {header.column.getIsSorted() === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-slate-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No customers found matching your filters.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-slate-600">
        Showing {table.getRowModel().rows.length} of {customers.length} customers
      </div>
    </div>
  )
}
