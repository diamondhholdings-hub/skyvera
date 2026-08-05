/**
 * Transform functions for Excel data
 * Converts raw Python output to validated TypeScript types
 */

import { ok, err, type Result } from '@/lib/types/result'
import type { Customer, CustomerWithHealth } from '@/lib/types/customer'
import type { FinancialMetrics, BUFinancialSummary, BU } from '@/lib/types/financial'
import { CustomerSchema } from '@/lib/types/customer'
import { FinancialMetricsSchema, BUFinancialSummarySchema } from '@/lib/types/financial'

/**
 * Transform raw customer data from Python to validated Customer type
 */
export function transformRawCustomer(raw: Record<string, unknown>): Result<Customer, Error> {
  try {
    const result = CustomerSchema.safeParse(raw)

    if (result.success) {
      return ok(result.data)
    } else {
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      return err(new Error(`Customer validation failed: ${errors}`))
    }
  } catch (error) {
    return err(new Error(`Transform failed: ${error instanceof Error ? error.message : 'Unknown'}`))
  }
}

/**
 * Transform raw financial data (from the Excel parser) to a validated FinancialMetrics object.
 *
 * Key mapping decisions:
 * - `arr` is derived as `totalRR × 4` (annualised quarterly RR).
 * - `grossMargin` is computed inline as `(revenue − COGS) / revenue × 100`.
 * - Missing numeric fields default to `0` rather than `undefined` so downstream
 *   calculations never divide by undefined.
 *
 * @param raw  Key/value map from the Excel parser, field names must match the mapping above
 * @returns    Result wrapping a validated FinancialMetrics, or an error listing Zod failures
 */
export function transformRawFinancials(raw: Record<string, unknown>): Result<FinancialMetrics, Error> {
  try {
    // Map raw financial data to FinancialMetrics schema
    const mapped = {
      bu: raw.bu as BU,
      quarterlyRR: (raw.totalRR as number) || 0,
      arr: ((raw.totalRR as number) || 0) * 4, // Annualize quarterly RR
      nrr: (raw.totalNRR as number) || 0,
      totalRevenue: (raw.totalRevenue as number) || 0,
      cogs: (raw.cogs as number) || 0,
      headcountCost: (raw.headcountCost as number) || 0,
      vendorCost: (raw.vendorCost as number) || 0,
      ebitda: (raw.ebitda as number) || 0,
      grossMargin: raw.totalRevenue ? ((raw.totalRevenue as number - (raw.cogs as number)) / (raw.totalRevenue as number)) * 100 : 0,
      netMargin: (raw.netMargin as number) || 0,
    }

    const result = FinancialMetricsSchema.safeParse(mapped)

    if (result.success) {
      return ok(result.data)
    } else {
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      return err(new Error(`Financial metrics validation failed: ${errors}`))
    }
  } catch (error) {
    return err(new Error(`Transform failed: ${error instanceof Error ? error.message : 'Unknown'}`))
  }
}

/**
 * Aggregate a flat customer list into per-BU financial summaries.
 *
 * EBITDA and margins are computed from hardcoded ratios (COGS 21%, OpEx 17%) as a
 * placeholder until the full Excel P&L adapter is wired in. Target margins come from
 * CLAUDE.md: Cloudsense 63.6%, Kandy 75%, STL 75%, NewNet 70%.
 *
 * Note: The `byBU` grouping map is currently unpopulated — this function is a
 * partial implementation and will produce an empty result until the customer data
 * model includes a `bu` field for grouping. Tracked as tech debt.
 *
 * @param customers  Flat list of customers (currently expected to be pre-grouped externally)
 * @returns          Map from BU name to its aggregated BUFinancialSummary
 */
export function aggregateByBU(customers: CustomerWithHealth[]): Map<BU, BUFinancialSummary> {
  const byBU = new Map<BU, CustomerWithHealth[]>()

  // Group customers by their annotated BU field.
  for (const customer of customers) {
    const bu = customer.bu as BU
    const existing = byBU.get(bu)
    if (existing) {
      existing.push(customer)
    } else {
      byBU.set(bu, [customer])
    }
  }

  const summaryMap = new Map<BU, BUFinancialSummary>()

  // Aggregate for each BU group
  for (const [bu, buCustomers] of byBU.entries()) {
    const totalRR = buCustomers.reduce((sum, c) => sum + c.rr, 0)
    const totalNRR = buCustomers.reduce((sum, c) => sum + c.nrr, 0)
    const totalRevenue = totalRR + totalNRR
    const customerCount = buCustomers.length

    // Calculate EBITDA and margins (placeholder calculation)
    const cogs = totalRevenue * 0.21
    const opex = totalRevenue * 0.17
    const ebitda = totalRevenue - cogs - opex
    const netMarginPct = totalRevenue ? (ebitda / totalRevenue) * 100 : 0

    // Target margins from CLAUDE.md
    const targetsByBU: Record<BU, number> = {
      Cloudsense: 63.6,
      Kandy: 75,
      STL: 75,
      NewNet: 70, // Assumed
    }

    const summary: BUFinancialSummary = {
      bu,
      totalRR,
      totalNRR,
      totalRevenue,
      customerCount,
      netMarginPct,
      netMarginTarget: targetsByBU[bu] || 70,
      ebitda,
    }

    const validationResult = BUFinancialSummarySchema.safeParse(summary)
    if (validationResult.success) {
      summaryMap.set(bu, validationResult.data)
    }
  }

  return summaryMap
}
