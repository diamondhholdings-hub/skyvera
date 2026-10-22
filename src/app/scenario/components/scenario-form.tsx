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
      <div className="segmented" role="group" aria-label="Scenario type">
        {(
          [
            ['financial', 'Financial'],
            ['headcount', 'Headcount'],
            ['customer', 'Customer'],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            aria-pressed={selectedType === type}
            onClick={() => handleTypeChange(type)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scenario Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="card space-y-4 p-5">
          {/* Description field (common to all types) */}
          <div>
            <label htmlFor="description" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="input h-auto py-2"
              placeholder="Describe this scenario"
            />
            {errors.description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.description?.message)}</p>
            )}
          </div>

          {/* Type-specific fields */}
          {selectedType === 'financial' && (
            <>
              <div>
                <label htmlFor="pricingChange" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Pricing change (%)
                </label>
                <input
                  id="pricingChange"
                  type="number"
                  step="0.1"
                  {...register('pricingChange', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.pricingChange && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.pricingChange?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="costChange" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Cost change (%)
                </label>
                <input
                  id="costChange"
                  type="number"
                  step="0.1"
                  {...register('costChange', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.costChange && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.costChange?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="targetMargin" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Target margin (%)
                </label>
                <input
                  id="targetMargin"
                  type="number"
                  step="any"
                  {...register('targetMargin', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.targetMargin && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.targetMargin?.message)}</p>
                )}
              </div>
            </>
          )}

          {selectedType === 'headcount' && (
            <>
              <div>
                <label htmlFor="headcountChange" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Headcount change
                </label>
                <input
                  id="headcountChange"
                  type="number"
                  step="1"
                  {...register('headcountChange', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.headcountChange && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.headcountChange?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="avgSalaryCost" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Average annual salary cost ($)
                </label>
                <input
                  id="avgSalaryCost"
                  type="number"
                  step="1000"
                  {...register('avgSalaryCost', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.avgSalaryCost && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.avgSalaryCost?.message)}</p>
                )}
              </div>
            </>
          )}

          {selectedType === 'customer' && (
            <>
              <div>
                <label htmlFor="churnRate" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Churn rate (%)
                </label>
                <input
                  id="churnRate"
                  type="number"
                  step="0.1"
                  {...register('churnRate', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.churnRate && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.churnRate?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="acquisitionCount" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  New customers
                </label>
                <input
                  id="acquisitionCount"
                  type="number"
                  step="1"
                  {...register('acquisitionCount', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.acquisitionCount && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.acquisitionCount?.message)}</p>
                )}
              </div>

              <div>
                <label htmlFor="avgCustomerARR" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
                  Average customer ARR ($)
                </label>
                <input
                  id="avgCustomerARR"
                  type="number"
                  step="1000"
                  {...register('avgCustomerARR', { valueAsNumber: true })}
                  className="input num"
                />
                {errors.avgCustomerARR && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.avgCustomerARR?.message)}</p>
                )}
              </div>
            </>
          )}

          {/* Affected BU (common to all types) */}
          <div>
            <label htmlFor="affectedBU" className="mb-1 block text-[13px] font-medium" style={{ color: 'var(--ink-2)' }}>
              Business unit
            </label>
            <select
              id="affectedBU"
              {...register('affectedBU')}
              className="input"
            >
              <option value="All">All</option>
              <option value="Cloudsense">Cloudsense</option>
              <option value="Kandy">Kandy</option>
              <option value="STL">STL</option>
            </select>
            {errors.affectedBU && (
              <p className="mt-1 text-sm" style={{ color: 'var(--critical-ink)' }}>{String(errors.affectedBU?.message)}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={analyzing} className="btn btn-primary">
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Analyzing
            </>
          ) : (
            'Analyze impact'
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
