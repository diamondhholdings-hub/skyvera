/**
 * Health check endpoint - verifies all system components
 * GET /api/health
 */

import { NextResponse } from 'next/server'
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import { getCacheManager } from '@/lib/cache/manager'

// Stub for orchestrator stats (will be implemented after Claude orchestrator is fully integrated)
function getOrchestratorStats() {
  try {
    // Try to import orchestrator, but gracefully handle if not available
    // This prevents build errors if orchestrator isn't fully wired yet
    return {
      available: false,
      message: 'Orchestrator stats not yet implemented',
    }
  } catch {
    return {
      available: false,
      message: 'Orchestrator not available',
    }
  }
}

export async function GET() {
  try {
    // Get connector factory and check adapter health
    const factory = await getConnectorFactory()
    const adapterHealth = await factory.healthCheck()
    const adapterStatus = factory.getAdapterStatus()

    // Get cache stats
    const cache = getCacheManager()
    const cacheStats = cache.stats()

    // Get orchestrator stats
    const orchestratorStats = getOrchestratorStats()

    // Build response
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      adapters: Object.fromEntries(
        Array.from(adapterHealth.entries()).map(([name, healthy]) => [
          name,
          {
            healthy,
            status: adapterStatus.get(name) || 'unknown',
          },
        ])
      ),
      cache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
      },
      orchestrator: orchestratorStats,
      environment: {
        anthropicKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
        newsApiKeyConfigured: !!process.env.NEWSAPI_KEY,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('[Health] Error:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : 'Unknown health check error',
      },
      { status: 500 }
    )
  }
}
