'use client'

/**
 * ScenarioForm - Interactive scenario modeling form
 * Supports financial, headcount, and customer scenarios with React Hook Form validation
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { BaselineMetrics } from '@/lib/data/server/scenario-data'
import {
  financialScenarioSchema,
  headcountScenarioSchema,
  customerScenarioSchema,
  type ImpactMetric,
  type ScenarioImpactResponse,
} from '@/lib/intelligence/scenarios/types'
import ImpactDisplay from './impact-display'

interface ScenarioFormProps {
  baseline: BaselineMetrics
}

type ScenarioType = 'financial' | 'headcount' | 'customer'

interface ScenarioResult {
  calculatedMetrics: ImpactMetric[]
  claudeAnalysis: ScenarioImpactResponse | null
  baseline: BaselineMetrics
}

export default function ScenarioForm({ baseline }: ScenarioFormProps) {
  const [selectedType, setSelectedType] = useState<ScenarioType>('financial')
  const [analyzing, setAnalyzing] = useState(false)
  const [impact, setImpact] = useState<ScenarioResult | null>(null)

  // Get schema for current type
  const getSchema = () => {
    switch (selectedType) {
      case 'financial':
        return financialScenarioSchema
      case 'headcount':
        return headcountScenarioSchema
      case 'customer':
        return customerScenarioSchema
    }
  }

  // Get default values for current type
  const getDefaultValues = () => {
    switch (selectedType) {
      case 'financial':
        return {
          type: 'financial' as const,
          description: '',
          pricingChange: 0,
          costChange: 0,
          targetMargin: baseline.netMarginTarget,
          affectedBU: 'All' as const,
        }
      case 'headcount':
        return {
          type: 'headcount' as const,
          description: '',
          headcountChange: 0,
          avgSalaryCost: 150000,
          affectedBU: 'All' as const,
        }
      case 'customer':
        return {
          type: 'customer' as const,
          description: '',
          churnRate: 0,
          acquisitionCount: 0,
          avgCustomerARR: 100000,
          affectedBU: 'All' as const,
        }
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(getSchema()) as any,
    defaultValues: getDefaultValues() as any,
  })

  // Handle type change
  const handleTypeChange = (type: ScenarioType) => {
    setSelectedType(type)
    setImpact(null) // Clear previous results
    reset(getDefaultValues() as any) // Reset form with new defaults
  }

  // Handle form submission
  const onSubmit = async (data: any) => {
    setAnalyzing(true)
    setImpact(null)

    try {
      const response = await fetch('/api/scenarios/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Failed to analyze scenario')
      }

      const result: ScenarioResult = await response.json()
      setImpact(result)
      toast.success('Scenario analysis complete')
    } catch (error) {
      console.error('Scenario analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to analyze scenario')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Scenario Type Selector */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => handleTypeChange('financial')}
          className={`px-6 py-2 rounded font-semibold transition-all ${
            selectedType === 'financial'
              ? 'border-2 border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
              : 'border-2 border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]'
          }`}
        >
          Financial
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('headcount')}
          className={`px-6 py-2 rounded font-semibold transition-all ${
            selectedType === 'headcount'
              ? 'border-2 border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
              : 'border-2 border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]'
          }`}
        >
          Headcount
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('customer')}
          className={`px-6 py-2 rounded font-semibold transition-all ${
            selectedType === 'customer'
              ? 'border-2 border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
              : 'border-2 border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]'
          }`}
        >
          Customer
        </button>
      </div>

      {/* Scenario Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded shadow-sm border border-[var(--border)] p-6 space-y-4">
          {/* Description field (common to all types) */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-[var(--ink)] mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="Describe this scenario..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.description?.message)}</p>
            )}
          </div>

          {/* Type-specific fields */}
          {selectedType === 'financial' && (
            <>
              <div>
                <label htmlFor="pricingChange" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Pricing Change (%)
                </label>
                <input
                  id="pricingChange"
                  type="number"
                  step="0.1"
                  {...register('pricingChange', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.pricingChange && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.pricingChange?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="costChange" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Cost Change (%)
                </label>
                <input
                  id="costChange"
                  type="number"
                  step="0.1"
                  {...register('costChange', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.costChange && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.costChange?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="targetMargin" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Target Margin (%)
                </label>
                <input
                  id="targetMargin"
                  type="number"
                  step="0.1"
                  {...register('targetMargin', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.targetMargin && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.targetMargin?.message)}</p>
                )}
              </div>
            </>
          )}

          {selectedType === 'headcount' && (
            <>
              <div>
                <label htmlFor="headcountChange" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Headcount Change
                </label>
                <input
                  id="headcountChange"
                  type="number"
                  step="1"
                  {...register('headcountChange', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.headcountChange && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.headcountChange?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="avgSalaryCost" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Avg Annual Salary Cost ($)
                </label>
                <input
                  id="avgSalaryCost"
                  type="number"
                  step="1000"
                  {...register('avgSalaryCost', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.avgSalaryCost && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.avgSalaryCost?.message)}</p>
                )}
              </div>
            </>
          )}

          {selectedType === 'customer' && (
            <>
              <div>
                <label htmlFor="churnRate" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Churn Rate (%)
                </label>
                <input
                  id="churnRate"
                  type="number"
                  step="0.1"
                  {...register('churnRate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.churnRate && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.churnRate?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="acquisitionCount" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  New Customers
                </label>
                <input
                  id="acquisitionCount"
                  type="number"
                  step="1"
                  {...register('acquisitionCount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.acquisitionCount && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.acquisitionCount?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="avgCustomerARR" className="block text-sm font-semibold text-[var(--ink)] mb-1">
                  Avg Customer ARR ($)
                </label>
                <input
                  id="avgCustomerARR"
                  type="number"
                  step="1000"
                  {...register('avgCustomerARR', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
                {errors.avgCustomerARR && (
                  <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.avgCustomerARR?.message)}</p>
                )}
              </div>
            </>
          )}

          {/* Affected BU (common to all types) */}
          <div>
            <label htmlFor="affectedBU" className="block text-sm font-semibold text-[var(--ink)] mb-1">
              Affected Business Unit
            </label>
            <select
              id="affectedBU"
              {...register('affectedBU')}
              className="w-full px-3 py-2 border-2 border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="All">All</option>
              <option value="Cloudsense">Cloudsense</option>
              <option value="Kandy">Kandy</option>
              <option value="STL">STL</option>
            </select>
            {errors.affectedBU && (
              <p className="mt-1 text-sm text-[var(--critical)]">{String(errors.affectedBU?.message)}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={analyzing}
          className="inline-flex items-center px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded hover:bg-[var(--accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Impact'
          )}
        </button>
      </form>

      {/* Impact Display */}
      {impact && (
        <ImpactDisplay
          calculatedMetrics={impact.calculatedMetrics}
          claudeAnalysis={impact.claudeAnalysis}
        />
      )}
    </div>
  )
}
