/**
 * DataAdapter base interface - all data adapters implement this
 * Provides unified abstraction for Excel files, Salesforce API, NewsAPI, and other data sources
 */

import type { Result } from '@/lib/types/result'

/**
 * Query parameters for adapter data requests
 */
export interface AdapterQuery {
  type: 'customers' | 'financials' | 'subscriptions' | 'news'
  filters?: {
    bu?: string
    customerName?: string
    quarter?: string
    limit?: number
  }
}

/**
 * Result from adapter query with metadata
 */
export interface DataResult {
  data: unknown[]
  source: string
  timestamp: Date
  count: number
}

/**
 * DataAdapter interface - all adapters must implement
 */
export interface DataAdapter {
  /** Adapter name for logging and identification */
  name: string

  /** Connect and initialize the adapter (load data, validate credentials, etc.) */
  connect(): Promise<Result<void, Error>>

  /** Query data from the adapter */
  query(query: AdapterQuery): Promise<Result<DataResult, Error>>

  /** Health check - return true if adapter is functional */
  healthCheck(): Promise<boolean>

  /** Disconnect and cleanup resources */
  disconnect(): Promise<void>
}
