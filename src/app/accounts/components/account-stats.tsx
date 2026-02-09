/**
 * AccountStats - Summary statistics for customer accounts
 * Server Component - displays total customers and health breakdown
 */

import { HealthIndicator } from '@/components/ui/health-indicator'

interface AccountStatsProps {
  stats: {
    total: number
    byBU: Record<string, number>
    byHealth: {
      green: number
      yellow: number
      red: number
    }
  }
}

export function AccountStats({ stats }: AccountStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-blue-500"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-slate-600">Total Customers</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Healthy Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <HealthIndicator score="green" label="" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Healthy</p>
            <p className="text-2xl font-bold text-green-600">{stats.byHealth.green}</p>
          </div>
        </div>
      </div>

      {/* At Risk Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <HealthIndicator score="yellow" label="" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">At Risk</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.byHealth.yellow}</p>
          </div>
        </div>
      </div>

      {/* Critical Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <HealthIndicator score="red" label="" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Critical</p>
            <p className="text-2xl font-bold text-red-600">{stats.byHealth.red}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
