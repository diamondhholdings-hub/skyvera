/**
 * ConnectorFactory - Unified data access layer
 * Registers, initializes, and routes queries to appropriate adapters
 * Provides parallel fetching and graceful degradation
 */

import type { DataAdapter, AdapterQuery, DataResult } from '../adapters/base'
import type { Result } from '@/lib/types/result'
import { ok, err } from '@/lib/types/result'
import { ExcelAdapter } from '../adapters/excel/parser'
import { NewsAPIAdapter } from '../adapters/external/newsapi'
import { NotionAdapter } from '../adapters/external/notion'

export type AdapterStatus = 'connected' | 'degraded' | 'failed'

interface AdapterRegistration {
  adapter: DataAdapter
  status: AdapterStatus
  error?: string
}

/**
 * ConnectorFactory - Registry and router for all data adapters
 */
export class ConnectorFactory {
  private adapters: Map<string, AdapterRegistration> = new Map()
  private initialized = false

  /**
   * Register an adapter by name
   */
  register(adapter: DataAdapter): void {
    this.adapters.set(adapter.name, {
      adapter,
      status: 'failed', // Default until connect() succeeds
    })
    console.log(`[ConnectorFactory] Registered adapter: ${adapter.name}`)
  }

  /**
   * Initialize all registered adapters
   * Returns status of each adapter initialization
   */
  async initialize(): Promise<
    Array<{ adapter: string; status: AdapterStatus; error?: string }>
  > {
    console.log(
      `[ConnectorFactory] Initializing ${this.adapters.size} adapters...`
    )

    const results: Array<{
      adapter: string
      status: AdapterStatus
      error?: string
    }> = []

    // Initialize all adapters in parallel
    const initPromises = Array.from(this.adapters.entries()).map(
      async ([name, registration]) => {
        try {
          const result = await registration.adapter.connect()

          if (result.success) {
            registration.status = 'connected'
            console.log(`[ConnectorFactory] ✓ ${name} connected`)
            return { adapter: name, status: 'connected' as AdapterStatus }
          } else {
            // Check if it's a degraded state (e.g., missing optional API key)
            const isDegraded =
              result.error.message.includes('degraded') ||
              result.error.message.includes('not configured')

            registration.status = isDegraded ? 'degraded' : 'failed'
            registration.error = result.error.message

            console.warn(
              `[ConnectorFactory] ${isDegraded ? '⚠' : '✗'} ${name} ${registration.status}: ${result.error.message}`
            )

            return {
              adapter: name,
              status: registration.status,
              error: result.error.message,
            }
          }
        } catch (error) {
          registration.status = 'failed'
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          registration.error = errorMessage

          console.error(
            `[ConnectorFactory] ✗ ${name} failed: ${errorMessage}`
          )

          return {
            adapter: name,
            status: 'failed' as AdapterStatus,
            error: errorMessage,
          }
        }
      }
    )

    results.push(...(await Promise.all(initPromises)))

    this.initialized = true
    console.log('[ConnectorFactory] Initialization complete')

    return results
  }

  /**
   * Get data from a specific adapter
   */
  async getData(
    source: string,
    query: AdapterQuery
  ): Promise<Result<DataResult, Error>> {
    if (!this.initialized) {
      return err(
        new Error(
          'ConnectorFactory not initialized. Call initialize() first.'
        )
      )
    }

    const registration = this.adapters.get(source)

    if (!registration) {
      return err(
        new Error(
          `Adapter '${source}' not found. Available: ${Array.from(this.adapters.keys()).join(', ')}`
        )
      )
    }

    if (registration.status === 'failed') {
      return err(
        new Error(
          `Adapter '${source}' is failed: ${registration.error || 'Unknown error'}`
        )
      )
    }

    if (registration.status === 'degraded') {
      return err(
        new Error(
          `Adapter '${source}' is degraded: ${registration.error || 'Functionality limited'}`
        )
      )
    }

    try {
      return await registration.adapter.query(query)
    } catch (error) {
      return err(
        new Error(
          `Query failed for '${source}': ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Fetch from multiple adapters in parallel
   * Returns Map of source to result (success or error)
   */
  async getDataParallel(
    requests: Array<{ source: string; query: AdapterQuery }>
  ): Promise<Map<string, Result<DataResult, Error>>> {
    const promises = requests.map(async ({ source, query }) => {
      const result = await this.getData(source, query)
      return { source, result }
    })

    const results = await Promise.allSettled(promises)

    const resultMap = new Map<string, Result<DataResult, Error>>()

    for (const settledResult of results) {
      if (settledResult.status === 'fulfilled') {
        resultMap.set(settledResult.value.source, settledResult.value.result)
      } else {
        // Promise rejected (shouldn't happen with our error handling, but just in case)
        resultMap.set(
          'unknown',
          err(
            new Error(
              `Parallel fetch failed: ${settledResult.reason instanceof Error ? settledResult.reason.message : 'Unknown'}`
            )
          )
        )
      }
    }

    return resultMap
  }

  /**
   * Health check all adapters
   * Returns Map of adapter name to health status
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>()

    const promises = Array.from(this.adapters.entries()).map(
      async ([name, registration]) => {
        try {
          const healthy = await registration.adapter.healthCheck()
          return { name, healthy }
        } catch (error) {
          console.error(
            `[ConnectorFactory] Health check failed for ${name}:`,
            error
          )
          return { name, healthy: false }
        }
      }
    )

    const results = await Promise.all(promises)

    for (const { name, healthy } of results) {
      healthMap.set(name, healthy)
    }

    return healthMap
  }

  /**
   * Get current status of all adapters
   */
  getAdapterStatus(): Map<string, AdapterStatus> {
    const statusMap = new Map<string, AdapterStatus>()

    for (const [name, registration] of this.adapters.entries()) {
      statusMap.set(name, registration.status)
    }

    return statusMap
  }

  /**
   * Get adapter by name (for direct access if needed)
   */
  getAdapter(name: string): DataAdapter | undefined {
    return this.adapters.get(name)?.adapter
  }

  /**
   * Disconnect all adapters (cleanup)
   */
  async disconnectAll(): Promise<void> {
    console.log('[ConnectorFactory] Disconnecting all adapters...')

    const promises = Array.from(this.adapters.values()).map((registration) =>
      registration.adapter.disconnect()
    )

    await Promise.all(promises)
    this.initialized = false

    console.log('[ConnectorFactory] All adapters disconnected')
  }
}

// Singleton instance
let connectorFactoryInstance: ConnectorFactory | null = null
let initializationPromise: Promise<ConnectorFactory> | null = null

/**
 * Get singleton ConnectorFactory instance
 * Automatically registers and initializes adapters on first call
 * Thread-safe: multiple simultaneous calls await the same initialization promise
 */
export async function getConnectorFactory(): Promise<ConnectorFactory> {
  // If already initialized, return immediately
  if (connectorFactoryInstance) {
    return connectorFactoryInstance
  }

  // If initialization is in progress, await it
  if (initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  initializationPromise = (async () => {
    const instance = new ConnectorFactory()

    // Register adapters
    instance.register(new ExcelAdapter())
    instance.register(new NewsAPIAdapter())
    instance.register(new NotionAdapter())

    // Initialize all adapters
    await instance.initialize()

    // Only set the singleton AFTER initialization completes
    connectorFactoryInstance = instance

    return instance
  })()

  return initializationPromise
}

/**
 * Reset singleton (for testing)
 */
export function resetConnectorFactory(): void {
  if (connectorFactoryInstance) {
    connectorFactoryInstance.disconnectAll()
  }
  connectorFactoryInstance = null
  initializationPromise = null
}
