/**
 * ExcelAdapter - loads Skyvera budget data from pre-built JSON snapshot
 * Snapshot generated locally via: npm run refresh-data
 * Falls back to Python bridge if snapshot is unavailable
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { readFileSync } from 'fs'
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
  // Real values from the Excel P&L sheets (present on every BU entry)
  marginTarget?: number
  deltaToMargin?: number
  rrPriorPlan?: number
  totalRevenuePriorPlan?: number
  // Company-wide metrics, only present on the consolidated 'Skyvera' entry
  arAgingOver90?: number | null
  arrYoYChangePct?: number | null
  ruleOf40?: number | null
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
   * Connect: Load data from JSON snapshot (Vercel-compatible).
   * Falls back to Python bridge if snapshot is missing (local dev only).
   */
  async connect(): Promise<Result<void, Error>> {
    try {
      const startTime = Date.now()
      let parsed: ParsedData

      // Try JSON snapshot first (works on Vercel and locally)
      const snapshotPath = join(this.projectRoot, 'src', 'data', 'skyvera-snapshot.json')
      try {
        const raw = readFileSync(snapshotPath, 'utf-8')
        parsed = JSON.parse(raw)
        console.log('[ExcelAdapter] Connecting - loading from JSON snapshot...')
      } catch (snapshotError) {
        if ((snapshotError as NodeJS.ErrnoException).code === 'ENOENT') {
          // Snapshot file not found — fall back to Python bridge (local dev only, not available on Vercel)
          console.warn('[ExcelAdapter] Snapshot not found, falling back to Python parser...')
          const { stdout, stderr } = await execFileAsync('python3', [
            this.scriptPath,
            '--type',
            'all',
          ])
          if (stderr) console.log('[ExcelAdapter] Python parser output:', stderr.trim())
          parsed = JSON.parse(stdout)
        } else {
          // Any other error (malformed JSON, permission denied, wrong schema, etc.) is a real
          // problem the developer needs to know about — do NOT silently fall back.
          return err(
            new Error(
              `Failed to load data snapshot at "${snapshotPath}": ${(snapshotError as Error).message}. ` +
              `Fix the underlying issue (e.g. run \`npm run refresh-data\` to regenerate the snapshot) and retry.`
            )
          )
        }
      }

      // Accounts that represent future sales targets, not real customers
      const EXCLUDED_ACCOUNTS = new Set([
        'New Sales Ps - Go Get',
        'New License Sales - Skyvera',
        'Various: License increments',
      ])

      // Validate and store customer data
      let totalValidated = 0
      let totalInvalid = 0

      for (const [buName, customers] of Object.entries(parsed.customers)) {
        const validatedCustomers: Customer[] = []

        for (const customer of customers) {
          if (EXCLUDED_ACCOUNTS.has(customer.customer_name)) {
            console.log(`[ExcelAdapter] Excluded placeholder account: "${customer.customer_name}" in ${buName}`)
            continue
          }
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
    // Can coerce if has required fields but types are slightly off.
    // rr and nrr must already be actual numbers — null means unknown revenue and
    // must NOT be silently stored as 0, which would corrupt BU revenue totals.
    return (
      customer.customer_name &&
      typeof customer.customer_name === 'string' &&
      typeof customer.rr === 'number' &&
      typeof customer.nrr === 'number' &&
      Array.isArray(customer.subscriptions)
    )
  }

  /**
   * Coerce a customer record to valid format
   */
  private coerceCustomer(customer: any): Customer {
    // Belt-and-suspenders: canCoerce already guarantees rr/nrr are numbers, but use
    // nullish coalescing (??) here so that a legitimate 0 value is preserved rather
    // than being treated as falsy and replaced (which || would do).
    return {
      customer_name: customer.customer_name,
      rr: customer.rr ?? 0,
      nrr: customer.nrr ?? 0,
      total: customer.total ?? (customer.rr ?? 0) + (customer.nrr ?? 0),
      subscriptions: customer.subscriptions ?? [],
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
