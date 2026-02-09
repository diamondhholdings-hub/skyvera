#!/usr/bin/env tsx
/**
 * Cache warmup script for hero accounts
 *
 * Pre-computes intelligence for hero accounts and caches results for demo stability.
 * Runs before demo to ensure hero accounts load instantly.
 */

import 'dotenv/config'
import { getCacheManager, CACHE_TTL } from '../src/lib/cache/manager'
import { getOrchestrator } from '../src/lib/intelligence/claude/orchestrator'
import { getAccountPlanData } from '../src/lib/data/server/account-plan-data'

// Hero accounts - use exact names from customer JSON files
const HERO_ACCOUNTS = [
  'British Telecommunications plc',
  'Liquid Telecom',
  'Telefonica UK Limited',
  'Spotify',
  'AT&T Services, Inc.'
]

interface WarmupResult {
  account: string
  intelligence: boolean
  accountData: boolean
  duration: number
  error?: string
}

/**
 * Generate intelligence for a single account
 */
async function generateIntelligence(
  accountName: string,
  orchestrator: any,
  cache: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Claude API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY not configured'
      }
    }

    // Get account plan data for context
    const accountData = await getAccountPlanData(accountName)
    if (!accountData.success) {
      return {
        success: false,
        error: `Failed to load account data: ${accountData.error.message}`
      }
    }

    const { stakeholders, strategy, competitors, news } = accountData.value

    // Build context for Claude
    const context = {
      account: accountName,
      stakeholders: stakeholders.slice(0, 3), // Top 3 stakeholders
      painPoints: strategy.painPoints,
      opportunities: strategy.opportunities,
      competitors: competitors.map(c => c.name),
      recentNews: news.articles.slice(0, 3).map(a => a.title)
    }

    // Generate intelligence using ClaudeOrchestrator
    const prompt = `Analyze this customer account and provide strategic intelligence:

Account: ${accountName}

Key Stakeholders:
${stakeholders.map(s => `- ${s.name} (${s.title}): ${s.relationshipStrength} relationship`).join('\n')}

Pain Points:
${strategy.painPoints.map(p => `- ${p.title}: ${p.description}`).join('\n')}

Opportunities:
${strategy.opportunities.map(o => `- ${o.title}: ${o.description} (${o.probability}% probability, $${o.estimatedValue?.toLocaleString()} value)`).join('\n')}

Competitors:
${competitors.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Recent News:
${news.articles.slice(0, 3).map(a => `- ${a.title}`).join('\n')}

Provide:
1. Top 3 strategic recommendations
2. Key risks to monitor
3. Expansion opportunities
4. Next actions

Format as JSON with fields: recommendations (array), risks (array), opportunities (array), nextActions (array).
Each item should have: title, description, priority (high/medium/low).
`

    const result = await orchestrator.processRequest({
      prompt,
      systemPrompt: 'You are a strategic account advisor for a B2B SaaS company. Provide actionable intelligence.',
      priority: 'MEDIUM',
      maxTokens: 2048,
      temperature: 0.7
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error.message
      }
    }

    // Cache the intelligence with 30-minute TTL for demo stability
    const cacheKey = `intelligence:${accountName}`
    cache.set(cacheKey, {
      content: result.value.content,
      generatedAt: new Date().toISOString(),
      model: result.value.model
    }, { ttl: 1800, jitter: false }) // 30 minutes, no jitter for predictable demo behavior

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Pre-load account plan data
 */
async function preloadAccountData(
  accountName: string,
  cache: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Load account plan data (stakeholders, strategy, etc.)
    const accountData = await getAccountPlanData(accountName)
    if (!accountData.success) {
      return {
        success: false,
        error: `Failed to load account data: ${accountData.error.message}`
      }
    }

    // Cache account plan data with 30-minute TTL for demo stability
    const cacheKey = `account-plan:${accountName}`
    cache.set(cacheKey, accountData.value, { ttl: 1800, jitter: false })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Main warmup execution
 */
async function main() {
  console.log('🚀 Starting cache warmup for hero accounts...\n')

  const startTime = Date.now()
  const results: WarmupResult[] = []

  // Initialize cache and orchestrator
  const cache = getCacheManager()
  const orchestrator = getOrchestrator(cache)
  console.log('✅ Cache and orchestrator ready\n')

  // Process each hero account
  for (const accountName of HERO_ACCOUNTS) {
    console.log(`🔥 Warming up: ${accountName}`)
    const accountStartTime = Date.now()

    const result: WarmupResult = {
      account: accountName,
      intelligence: false,
      accountData: false,
      duration: 0
    }

    // Pre-load account plan data
    const accountDataResult = await preloadAccountData(accountName, cache)
    result.accountData = accountDataResult.success
    if (!accountDataResult.success) {
      console.log(`   ⚠️  Account data: ${accountDataResult.error}`)
    } else {
      console.log(`   ✅ Account data cached`)
    }

    // Generate and cache intelligence (with rate limiting pause)
    if (results.length > 0) {
      // Add 2 second delay between Claude API calls to avoid 429 errors
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const intelligenceResult = await generateIntelligence(accountName, orchestrator, cache)
    result.intelligence = intelligenceResult.success
    if (!intelligenceResult.success) {
      console.log(`   ⚠️  Intelligence: ${intelligenceResult.error}`)
      result.error = intelligenceResult.error
    } else {
      console.log(`   ✅ Intelligence cached`)
    }

    result.duration = Date.now() - accountStartTime
    results.push(result)
    console.log(`   ⏱️  Completed in ${(result.duration / 1000).toFixed(1)}s\n`)
  }

  // Verify cache status
  console.log('🔍 Verifying cache status...\n')
  for (const result of results) {
    const intelligenceKey = `intelligence:${result.account}`
    const accountDataKey = `account-plan:${result.account}`

    const intelligenceCached = cache.getWithMetadata(intelligenceKey) !== null
    const accountDataCached = cache.getWithMetadata(accountDataKey) !== null

    const status = intelligenceCached && accountDataCached ? '✅' : '⚠️'
    console.log(`${status} ${result.account}`)
    console.log(`   Intelligence: ${intelligenceCached ? '✅ cached' : '❌ missing'}`)
    console.log(`   Account data: ${accountDataCached ? '✅ cached' : '❌ missing'}`)
  }

  // Summary
  const totalDuration = Date.now() - startTime
  const successCount = results.filter(r => r.intelligence && r.accountData).length
  const intelligenceCount = results.filter(r => r.intelligence).length
  const accountDataCount = results.filter(r => r.accountData).length

  console.log('\n' + '='.repeat(60))
  console.log('✨ Cache warmup complete!')
  console.log(`   Full success: ${successCount}/${HERO_ACCOUNTS.length} accounts`)
  console.log(`   Intelligence: ${intelligenceCount}/${HERO_ACCOUNTS.length} accounts`)
  console.log(`   Account data: ${accountDataCount}/${HERO_ACCOUNTS.length} accounts`)
  console.log(`   Duration: ${(totalDuration / 1000).toFixed(1)}s`)

  if (successCount === HERO_ACCOUNTS.length) {
    console.log('   🎉 Demo ready!')
  } else if (intelligenceCount === 0 && accountDataCount === HERO_ACCOUNTS.length) {
    console.log('   ⚠️  Intelligence skipped (no API key) - account data cached')
  } else {
    console.log('   ⚠️  Some accounts incomplete - check errors above')
  }
  console.log('='.repeat(60))

  // Exit with code 0 even if some accounts failed (graceful degradation)
  process.exit(0)
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}
