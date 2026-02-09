/**
 * Next.js Instrumentation Hook
 * Runs once when the Next.js server starts (before any requests)
 * Used to initialize ConnectorFactory for data access
 */

export async function register() {
  // Only run on server (not in edge runtime or middleware)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getConnectorFactory } = await import('./src/lib/data/registry/connector-factory')

    try {
      console.log('[Instrumentation] Initializing ConnectorFactory...')
      const factory = await getConnectorFactory()
      console.log('[Instrumentation] ConnectorFactory initialized successfully')
    } catch (error) {
      console.error('[Instrumentation] Error during initialization:', error)
    }
  }
}
