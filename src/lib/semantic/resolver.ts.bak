/**
 * SemanticResolver - single source of truth for all metric calculations
 * Resolves metrics by name with caching and pluggable data sources
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { CacheManager } from '../cache/manager'
import type { Result } from '../types/result'
import { ok, err } from '../types/result'
import type { Customer, BUCustomerData } from '../types/customer'
import type { BU } from '../types/financial'
import { METRIC_DEFINITIONS, getMetricDefinition } from './schema/financial'

/**
 * Financial data structure for metric calculations
 */
export interface FinancialData {
  bu: BU
  quarterlyRR: number
  currentRR: number
  priorRR: number
  nrr: number
  totalRevenue: number
  cogs: number
  opex: number
  totalCosts: number
  customerCount: number
}

/**
 * Customer financials for a specific customer
 */
export interface CustomerFinancials {
  customerName: string
  bu: BU
  rr: number
  nrr: number
  total: number
  arr: number
  subscriptionCount: number
}

/**
 * DataProvider interface - abstraction for data sources
 * Implemented by adapters in Plan 04 (Excel, Salesforce, etc.)
 */
export interface DataProvider {
  getFinancialData(bu: BU, quarter?: string): Promise<Result<FinancialData, Error>>
  getCustomerData(bu: BU): Promise<Result<Customer[], Error>>
}

/**
 * MockDataProvider - loads data from JSON files for immediate testing
 * This enables testing the semantic layer before adapters are built in Plan 04
 */
export class MockDataProvider implements DataProvider {
  private dataPath: string

  constructor(dataPath: string = join(process.cwd(), 'data')) {
    this.dataPath = dataPath
  }

  async getFinancialData(bu: BU, quarter?: string): Promise<Result<FinancialData, Error>> {
    try {
      // For mock, return aggregated data from customer files
      const customersResult = await this.getCustomerData(bu)
      if (!customersResult.success) {
        return err(customersResult.error)
      }

      const customers = customersResult.value
      const totalRR = customers.reduce((sum, c) => sum + c.rr, 0)
      const totalNRR = customers.reduce((sum, c) => sum + c.nrr, 0)
      const totalRevenue = totalRR + totalNRR

      // Mock financials based on customer data
      const financialData: FinancialData = {
        bu,
        quarterlyRR: totalRR,
        currentRR: totalRR,
        priorRR: totalRR * 1.05, // Mock 5% historical decline
        nrr: totalNRR,
        totalRevenue,
        cogs: totalRevenue * 0.21, // Mock 21% COGS from CLAUDE.md
        opex: totalRevenue * 0.17, // Mock 17% OpEx
        totalCosts: totalRevenue * 0.38, // Mock total costs
        customerCount: customers.length,
      }

      return ok(financialData)
    } catch (error) {
      return err(
        new Error(
          `Failed to load mock financial data for ${bu}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  async getCustomerData(bu: BU): Promise<Result<Customer[], Error>> {
    try {
      const buNameMap: Record<BU, string> = {
        Cloudsense: 'cloudsense',
        Kandy: 'kandy',
        STL: 'stl',
        NewNet: 'newnet',
      }

      const fileName = `customers_${buNameMap[bu]}_all.json`
      const filePath = join(this.dataPath, fileName)

      const fileContent = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(fileContent) as BUCustomerData

      return ok(data.customers)
    } catch (error) {
      return err(
        new Error(
          `Failed to load customer data for ${bu}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }
}

/**
 * SemanticResolver - resolves metrics using cache and data provider
 */
export class SemanticResolver {
  private cache: CacheManager
  private dataProvider: DataProvider

  constructor(cache: CacheManager, dataProvider: DataProvider) {
    this.cache = cache
    this.dataProvider = dataProvider
  }

  /**
   * Resolve a metric by name with caching
   *
   * @param metricName Name of the metric (ARR, EBITDA, NetMargin, etc.)
   * @param context Context for the metric (business unit, quarter)
   * @returns Result containing the calculated metric value
   */
  async resolveMetric(
    metricName: string,
    context: { bu?: BU; quarter?: string }
  ): Promise<Result<number, Error>> {
    // Check if metric exists
    const metricDef = METRIC_DEFINITIONS[metricName]
    if (!metricDef) {
      return err(new Error(`Unknown metric: ${metricName}`))
    }

    // Build cache key
    const cacheKey = `metric:${metricName}:${context.bu || 'all'}:${context.quarter || 'current'}`

    try {
      // Use cache-aside pattern with 5-minute TTL for financial data
      const value = await this.cache.get(
        cacheKey,
        async () => {
          // Fetch financial data from provider
          if (!context.bu) {
            throw new Error(`Business unit required for metric ${metricName}`)
          }

          const financialResult = await this.dataProvider.getFinancialData(
            context.bu,
            context.quarter
          )

          if (!financialResult.success) {
            throw financialResult.error
          }

          // Calculate metric using definition
          const data = financialResult.value as unknown as Record<string, number>
          return metricDef.calculate(data)
        },
        { ttl: 300, jitter: true } // 5 minutes with jitter
      )

      return ok(value)
    } catch (error) {
      return err(
        new Error(
          `Failed to resolve metric ${metricName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Resolve all financial metrics for a specific customer
   *
   * @param customerName Name of the customer
   * @param bu Business unit the customer belongs to
   * @returns Result containing customer financial metrics
   */
  async resolveCustomerMetrics(
    customerName: string,
    bu: BU
  ): Promise<Result<CustomerFinancials, Error>> {
    const cacheKey = `customer:${bu}:${customerName}`

    try {
      const metrics = await this.cache.get(
        cacheKey,
        async () => {
          // Fetch customer data from provider
          const customersResult = await this.dataProvider.getCustomerData(bu)

          if (!customersResult.success) {
            throw customersResult.error
          }

          // Find the specific customer
          const customer = customersResult.value.find((c) => c.customer_name === customerName)

          if (!customer) {
            throw new Error(`Customer ${customerName} not found in ${bu}`)
          }

          // Calculate customer metrics
          const customerMetrics: CustomerFinancials = {
            customerName: customer.customer_name,
            bu,
            rr: customer.rr,
            nrr: customer.nrr,
            total: customer.total,
            arr: customer.rr * 4, // Annualize quarterly RR
            subscriptionCount: customer.subscriptions.length,
          }

          return customerMetrics
        },
        { ttl: 600, jitter: true } // 10 minutes with jitter for customer data
      )

      return ok(metrics)
    } catch (error) {
      return err(
        new Error(
          `Failed to resolve customer metrics for ${customerName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Get metric definitions formatted for Claude prompt injection
   *
   * @param metricNames Optional array of specific metric names. If omitted, returns all metrics.
   * @returns Formatted string with metric definitions
   */
  getMetricDefinitionsForPrompt(metricNames?: string[]): string {
    if (!metricNames || metricNames.length === 0) {
      // Return all metric definitions
      const allDefs = Object.keys(METRIC_DEFINITIONS)
        .map((name) => getMetricDefinition(name))
        .join('\n\n')

      return `# Available Business Metrics\n\n${allDefs}`
    }

    // Return specific metric definitions
    const specificDefs = metricNames
      .filter((name) => METRIC_DEFINITIONS[name]) // Only include valid metrics
      .map((name) => getMetricDefinition(name))
      .join('\n\n')

    return `# Business Metrics\n\n${specificDefs}`
  }
}
