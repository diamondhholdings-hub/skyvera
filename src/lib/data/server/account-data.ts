/**
 * Server-side data fetching for customer accounts with health scores
 * CRITICAL: Annotates each customer with `bu` field during data assembly
 * These functions are called directly from Server Components (no API routes)
 */

import { getConnectorFactory } from '../registry/connector-factory'
import { calculateHealthScore } from '@/lib/semantic/schema/customer'
import type { Customer, CustomerWithHealth } from '@/lib/types/customer'
import type { BU } from '@/lib/types/financial'
import { ok, err, type Result } from '@/lib/types/result'

/**
 * Customer count summary
 */
export interface CustomerCountSummary {
  total: number
  byBU: Record<string, number>
  byHealth: {
    green: number
    yellow: number
    red: number
  }
}

/**
 * Get all customers with health scores and BU annotation
 * CRITICAL: Each customer is annotated with its BU during iteration
 */
export async function getAllCustomersWithHealth(): Promise<
  Result<CustomerWithHealth[], Error>
> {
  try {
    const factory = await getConnectorFactory()

    // Fetch all customers from Excel (returns customers grouped by BU)
    const result = await factory.getData('excel', {
      type: 'customers',
      filters: {},
    })

    if (!result.success) {
      console.error('[getAllCustomersWithHealth] Failed to fetch customers:', result.error)
      return err(result.error)
    }

    // Excel adapter returns customers already grouped by BU
    // We need to query each BU separately to track which BU each customer belongs to
    const BUs: BU[] = ['Cloudsense', 'Kandy', 'STL', 'NewNet']
    const allCustomersWithHealth: CustomerWithHealth[] = []

    for (const bu of BUs) {
      const buResult = await factory.getData('excel', {
        type: 'customers',
        filters: { bu },
      })

      if (!buResult.success) {
        console.warn(`[getAllCustomersWithHealth] Failed to fetch customers for ${bu}:`, buResult.error)
        continue // Skip this BU but continue with others
      }

      const customers = buResult.value.data as Customer[]

      // For each customer, annotate with BU and calculate health
      for (const customer of customers) {
        const health = calculateHealthScore(customer, {
          // Context: For demo, assume no historical RR or AR aging data yet
          // Phase 3 will add this from actual data
        })

        const customerWithHealth: CustomerWithHealth = {
          ...customer,
          bu, // CRITICAL: Annotate with BU name
          healthScore: health.score,
          healthFactors: health.factors,
        }

        allCustomersWithHealth.push(customerWithHealth)
      }
    }

    // Sort by total revenue descending
    allCustomersWithHealth.sort((a, b) => b.total - a.total)

    console.log(
      `[getAllCustomersWithHealth] Loaded ${allCustomersWithHealth.length} customers with health scores`
    )

    return ok(allCustomersWithHealth)
  } catch (error) {
    console.error('[getAllCustomersWithHealth] Unexpected error:', error)
    return err(
      new Error(
        `Failed to fetch customers with health: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get customers for specific BU with health scores
 */
export async function getCustomersByBU(bu: BU): Promise<Result<CustomerWithHealth[], Error>> {
  try {
    const factory = await getConnectorFactory()

    const result = await factory.getData('excel', {
      type: 'customers',
      filters: { bu },
    })

    if (!result.success) {
      console.error(`[getCustomersByBU] Failed to fetch customers for ${bu}:`, result.error)
      return err(result.error)
    }

    const customers = result.value.data as Customer[]

    // Annotate with BU and calculate health for each customer
    const customersWithHealth: CustomerWithHealth[] = customers.map((customer) => {
      const health = calculateHealthScore(customer, {
        // Context: For demo, assume no historical RR or AR aging data yet
      })

      return {
        ...customer,
        bu, // CRITICAL: Annotate with BU name
        healthScore: health.score,
        healthFactors: health.factors,
      }
    })

    // Sort by total revenue descending
    customersWithHealth.sort((a, b) => b.total - a.total)

    return ok(customersWithHealth)
  } catch (error) {
    console.error(`[getCustomersByBU] Unexpected error for ${bu}:`, error)
    return err(
      new Error(
        `Failed to fetch customers for ${bu}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get customer count summary (total, by BU, by health score)
 */
export async function getCustomerCount(): Promise<Result<CustomerCountSummary, Error>> {
  try {
    const result = await getAllCustomersWithHealth()

    if (!result.success) {
      return err(result.error)
    }

    const customers = result.value

    // Count by BU
    const byBU: Record<string, number> = {}
    for (const customer of customers) {
      byBU[customer.bu] = (byBU[customer.bu] || 0) + 1
    }

    // Count by health score
    const byHealth = {
      green: customers.filter((c) => c.healthScore === 'green').length,
      yellow: customers.filter((c) => c.healthScore === 'yellow').length,
      red: customers.filter((c) => c.healthScore === 'red').length,
    }

    return ok({
      total: customers.length,
      byBU,
      byHealth,
    })
  } catch (error) {
    console.error('[getCustomerCount] Unexpected error:', error)
    return err(
      new Error(
        `Failed to get customer count: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}
