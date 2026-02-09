/**
 * Transform functions for Excel data
 * Converts raw Python output to validated TypeScript types
 */

import { ok, err, type Result } from '@/lib/types/result'
import type { Customer } from '@/lib/types/customer'
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
 * Transform raw financial data to validated FinancialMetrics type
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
 * Aggregate customer data into BU-level financial summaries
 */
export function aggregateByBU(customers: Customer[]): Map<BU, BUFinancialSummary> {
  const byBU = new Map<BU, Customer[]>()

  // Group customers by BU (we'll need to enhance customer data with BU field in real implementation)
  // For now, this is a placeholder that assumes customers are already grouped

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
