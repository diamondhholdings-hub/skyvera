/**
 * RealDataProvider - connects SemanticResolver to real data adapters
 * Replaces MockDataProvider for production use
 */

import type { DataProvider, FinancialData } from '@/lib/semantic/resolver'
import type { Customer } from '@/lib/types/customer'
import type { BU } from '@/lib/types/financial'
import type { Result } from '@/lib/types/result'
import { ok, err } from '@/lib/types/result'
import { getConnectorFactory } from '../registry/connector-factory'

/**
 * RealDataProvider - fetches data from Excel adapter via ConnectorFactory
 */
export class RealDataProvider implements DataProvider {
  /**
   * Get financial data for a BU from Excel adapter
   */
  async getFinancialData(
    bu: BU,
    quarter?: string
  ): Promise<Result<FinancialData, Error>> {
    try {
      const factory = await getConnectorFactory()

      // Fetch financials from Excel adapter
      const financialsResult = await factory.getData('excel', {
        type: 'financials',
        filters: { bu },
      })

      if (!financialsResult.success) {
        return err(financialsResult.error)
      }

      // Fetch customers for customer count
      const customersResult = await factory.getData('excel', {
        type: 'customers',
        filters: { bu },
      })

      if (!customersResult.success) {
        return err(customersResult.error)
      }

      const financials = financialsResult.value.data[0] as any
      const customers = customersResult.value.data as Customer[]

      // Map to FinancialData format expected by SemanticResolver
      const financialData: FinancialData = {
        bu,
        quarterlyRR: financials.totalRR || 0,
        currentRR: financials.totalRR || 0,
        priorRR: (financials.totalRR || 0) * 1.05, // TODO: Get actual prior period data
        nrr: financials.totalNRR || 0,
        totalRevenue: financials.totalRevenue || 0,
        cogs: financials.cogs || 0,
        opex:
          (financials.headcountCost || 0) +
          (financials.coreAllocation || 0),
        totalCosts:
          (financials.cogs || 0) +
          (financials.headcountCost || 0) +
          (financials.vendorCost || 0) +
          (financials.coreAllocation || 0),
        customerCount: customers.length,
      }

      return ok(financialData)
    } catch (error) {
      return err(
        new Error(
          `Failed to fetch financial data: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Get customer data for a BU from Excel adapter
   */
  async getCustomerData(bu: BU): Promise<Result<Customer[], Error>> {
    try {
      const factory = await getConnectorFactory()

      const result = await factory.getData('excel', {
        type: 'customers',
        filters: { bu },
      })

      if (!result.success) {
        return err(result.error)
      }

      const customers = result.value.data as Customer[]
      return ok(customers)
    } catch (error) {
      return err(
        new Error(
          `Failed to fetch customer data: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }
}
