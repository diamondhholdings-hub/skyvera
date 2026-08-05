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

    const allHealthy = Array.from(adapterHealth.values()).every(Boolean)

    // Full diagnostic detail (per-adapter status, which integration keys are
    // configured) goes to server logs only — this endpoint is unauthenticated
    // and public, so the HTTP response stays minimal to avoid handing an
    // unauthenticated caller a map of exactly which attack surfaces are live.
    console.log('[Health] Diagnostic detail:', {
      adapters: Object.fromEntries(
        Array.from(adapterHealth.entries()).map(([name, healthy]) => [
          name,
          { healthy, status: adapterStatus.get(name) || 'unknown' },
        ])
      ),
      orchestrator: orchestratorStats,
      environment: {
        anthropicKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
        newsApiKeyConfigured: !!process.env.NEWSAPI_KEY,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
    })

    const response = {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      cache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
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
