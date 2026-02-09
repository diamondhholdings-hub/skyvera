/**
 * ExcelAdapter - parses Skyvera budget file via Python bridge
 * Loads data once at connect(), serves from memory, validates all records
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import type { DataAdapter, AdapterQuery, DataResult } from '../base'
import { ok, err, type Result } from '@/lib/types/result'
import { CustomerSchema, type Customer } from '@/lib/types/customer'
import { DataValidator } from '@/lib/semantic/validator'
import type { BU } from '@/lib/types/financial'

const execFileAsync = promisify(execFile)

/**
 * Financial metrics extracted from Excel
 */
interface FinancialSummary {
  bu: string
  totalRR: number
  totalNRR: number
  totalRevenue: number
  cogs: number
  headcountCost: number
  vendorCost: number
  coreAllocation: number
  ebitda: number
  netMargin: number
  customerCount: number
}

/**
 * Raw data structure from Python parser
 */
interface ParsedData {
  customers: Record<string, Customer[]>
  financials: Record<string, FinancialSummary>
}

/**
 * ExcelAdapter - loads Skyvera budget data via Python openpyxl bridge
 */
export class ExcelAdapter implements DataAdapter {
  name = 'excel'

  private customersByBU: Map<string, Customer[]> = new Map()
  private financialsByBU: Map<string, FinancialSummary> = new Map()
  private validator: DataValidator = new DataValidator()
  private connected = false
  private scriptPath: string
  private projectRoot: string

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd()
    this.scriptPath = join(this.projectRoot, 'scripts', 'parse_excel_to_json.py')
  }

  /**
   * Connect: Parse Excel file via Python, validate, and store in memory
   */
  async connect(): Promise<Result<void, Error>> {
    try {
      console.log('[ExcelAdapter] Connecting - parsing Excel file via Python...')
      const startTime = Date.now()

      // Run Python parser
      const { stdout, stderr } = await execFileAsync('python3', [
        this.scriptPath,
        '--type',
        'all',
      ])

      // Log Python stderr (progress messages)
      if (stderr) {
        console.log('[ExcelAdapter] Python parser output:', stderr.trim())
      }

      // Parse JSON output
      const parsed: ParsedData = JSON.parse(stdout)

      // Validate and store customer data
      let totalValidated = 0
      let totalInvalid = 0

      for (const [buName, customers] of Object.entries(parsed.customers)) {
        const validatedCustomers: Customer[] = []

        for (const customer of customers) {
          const validationResult = this.validator.validateCustomer(customer)

          if (validationResult.success) {
            validatedCustomers.push(validationResult.value)
            totalValidated++
          } else {
            // Log validation failure but continue (graceful degradation)
            console.warn(
              `[ExcelAdapter] Validation failed for customer ${customer.customer_name} in ${buName}:`,
              validationResult.error
            )
            totalInvalid++

            // Try coercion for minor issues
            if (this.canCoerce(customer)) {
              const coerced = this.coerceCustomer(customer)
              validatedCustomers.push(coerced)
              totalValidated++
              totalInvalid--
              console.log(
                `[ExcelAdapter] Successfully coerced customer ${customer.customer_name}`
              )
            }
          }
        }

        this.customersByBU.set(buName, validatedCustomers)
      }

      // Store financial data (already validated by Python aggregation)
      for (const [buName, financials] of Object.entries(parsed.financials)) {
        this.financialsByBU.set(buName, financials)
      }

      const duration = Date.now() - startTime

      console.log(`[ExcelAdapter] Connected successfully in ${duration}ms`)
      console.log(`[ExcelAdapter] Loaded ${totalValidated} valid customers`)
      if (totalInvalid > 0) {
        console.warn(`[ExcelAdapter] ${totalInvalid} customers failed validation`)
      }
      console.log(`[ExcelAdapter] Loaded financials for ${this.financialsByBU.size} BUs`)

      this.connected = true
      return ok(undefined)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during Excel parsing'

      console.error('[ExcelAdapter] Connection failed:', errorMessage)

      // Provide helpful error messages
      if (errorMessage.includes('ENOENT') && errorMessage.includes('python3')) {
        return err(new Error('Python 3 not found. Install Python 3 to parse Excel files.'))
      }

      if (errorMessage.includes('ENOENT') && errorMessage.includes('parse_excel_to_json.py')) {
        return err(
          new Error(
            `Parser script not found at ${this.scriptPath}. Check project structure.`
          )
        )
      }

      if (errorMessage.includes('Unexpected token')) {
        return err(
          new Error(
            'Failed to parse JSON output from Python. Check Excel file format.'
          )
        )
      }

      return err(new Error(`Excel adapter connection failed: ${errorMessage}`))
    }
  }

  /**
   * Query data from in-memory store
   */
  async query(query: AdapterQuery): Promise<Result<DataResult, Error>> {
    if (!this.connected) {
      return err(
        new Error('Excel adapter not connected. Call connect() first.')
      )
    }

    try {
      let data: unknown[] = []

      switch (query.type) {
        case 'customers': {
          if (query.filters?.bu) {
            // Specific BU
            const customers = this.customersByBU.get(query.filters.bu) || []

            // Filter by customer name if provided
            if (query.filters.customerName) {
              const filtered = customers.filter((c) =>
                c.customer_name
                  .toLowerCase()
                  .includes(query.filters!.customerName!.toLowerCase())
              )
              data = filtered
            } else {
              data = customers
            }
          } else {
            // All BUs
            data = Array.from(this.customersByBU.values()).flat()
          }

          // Apply limit
          if (query.filters?.limit) {
            data = data.slice(0, query.filters.limit)
          }
          break
        }

        case 'financials': {
          if (query.filters?.bu) {
            const financials = this.financialsByBU.get(query.filters.bu)
            data = financials ? [financials] : []
          } else {
            data = Array.from(this.financialsByBU.values())
          }
          break
        }

        case 'subscriptions': {
          // Extract subscriptions from customer data
          const buFilter = query.filters?.bu
          const customerFilter = query.filters?.customerName

          let customers: Customer[] = []

          if (buFilter) {
            customers = this.customersByBU.get(buFilter) || []
          } else {
            customers = Array.from(this.customersByBU.values()).flat()
          }

          if (customerFilter) {
            customers = customers.filter((c) =>
              c.customer_name.toLowerCase().includes(customerFilter.toLowerCase())
            )
          }

          data = customers.flatMap((c) =>
            c.subscriptions.map((sub) => ({
              ...sub,
              customerName: c.customer_name,
              bu: buFilter || 'Unknown',
            }))
          )

          if (query.filters?.limit) {
            data = data.slice(0, query.filters.limit)
          }
          break
        }

        default:
          return err(
            new Error(
              `Excel adapter does not support query type: ${query.type}`
            )
          )
      }

      return ok({
        data,
        source: this.name,
        timestamp: new Date(),
        count: data.length,
      })
    } catch (error) {
      return err(
        new Error(
          `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Health check - return true if data loaded
   */
  async healthCheck(): Promise<boolean> {
    return (
      this.connected &&
      this.customersByBU.size > 0 &&
      this.financialsByBU.size > 0
    )
  }

  /**
   * Disconnect - clear in-memory data
   */
  async disconnect(): Promise<void> {
    this.customersByBU.clear()
    this.financialsByBU.clear()
    this.connected = false
    console.log('[ExcelAdapter] Disconnected')
  }

  /**
   * Check if a customer record can be coerced to valid format
   */
  private canCoerce(customer: any): boolean {
    // Can coerce if has required fields but types are slightly off
    return (
      customer.customer_name &&
      typeof customer.customer_name === 'string' &&
      (typeof customer.rr === 'number' || customer.rr === null) &&
      (typeof customer.nrr === 'number' || customer.nrr === null) &&
      Array.isArray(customer.subscriptions)
    )
  }

  /**
   * Coerce a customer record to valid format
   */
  private coerceCustomer(customer: any): Customer {
    return {
      customer_name: customer.customer_name,
      rr: customer.rr || 0,
      nrr: customer.nrr || 0,
      total: customer.total || (customer.rr || 0) + (customer.nrr || 0),
      subscriptions: customer.subscriptions || [],
      rank: customer.rank,
      pct_of_total: customer.pct_of_total,
    }
  }

  /**
   * Get statistics about loaded data
   */
  getStats() {
    return {
      connected: this.connected,
      buCount: this.customersByBU.size,
      totalCustomers: Array.from(this.customersByBU.values()).reduce(
        (sum, customers) => sum + customers.length,
        0
      ),
      totalRevenue: Array.from(this.financialsByBU.values()).reduce(
        (sum, f) => sum + f.totalRevenue,
        0
      ),
    }
  }
}
