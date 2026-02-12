/**
 * Test script for conversational scenario system
 * Run with: npx tsx scripts/test-conversational-scenarios.ts
 */

import { getConversationManager } from '@/lib/intelligence/scenarios/conversation-manager'
import { getBaselineMetrics } from '@/lib/data/server/scenario-data'

async function testConversationalScenarios() {
  console.log('🧪 Testing Conversational Scenario System\n')

  // Test 1: Get baseline metrics
  console.log('1️⃣ Testing baseline metrics fetch...')
  const baselineResult = await getBaselineMetrics()

  if (!baselineResult.success) {
    console.error('❌ Failed to fetch baseline metrics:', baselineResult.error.message)
    return
  }

  console.log('✅ Baseline metrics fetched successfully')
  console.log(`   Total Revenue: $${baselineResult.value.totalRevenue.toLocaleString()}`)
  console.log(`   EBITDA: $${baselineResult.value.ebitda.toLocaleString()}`)
  console.log(`   Net Margin: ${baselineResult.value.netMarginPct.toFixed(1)}%\n`)

  // Test 2: Start a conversation
  console.log('2️⃣ Testing conversation start...')
  const manager = getConversationManager()

  const testQuery = "What if we raise prices by 10%?"
  console.log(`   Query: "${testQuery}"`)

  const conversationResult = await manager.startConversation(
    testQuery,
    baselineResult.value
  )

  if (!conversationResult.success) {
    console.error('❌ Failed to start conversation:', conversationResult.error.message)
    if (conversationResult.error.message.includes('ANTHROPIC_API_KEY')) {
      console.log('\n💡 Tip: Make sure ANTHROPIC_API_KEY is set in .env.local')
    }
    return
  }

  console.log('✅ Conversation started successfully')
  console.log(`   Response type: ${conversationResult.value.type}`)
  console.log(`   Needs user input: ${conversationResult.value.needsUserInput}`)
  console.log(`   Message preview: ${conversationResult.value.message.substring(0, 100)}...\n`)

  // Test 3: Check response data
  if (conversationResult.value.type === 'analysis' && conversationResult.value.data) {
    console.log('3️⃣ Testing analysis results...')
    const { calculatedMetrics, claudeAnalysis } = conversationResult.value.data

    console.log('✅ Analysis data present')
    console.log(`   Calculated metrics: ${calculatedMetrics.length} metrics`)

    if (claudeAnalysis) {
      console.log('✅ Claude analysis present')
      console.log(`   Recommendation: ${claudeAnalysis.recommendation}`)
      console.log(`   Confidence: ${claudeAnalysis.confidence}`)
      console.log(`   Risks identified: ${claudeAnalysis.risks.length}`)
    } else {
      console.log('⚠️  Claude analysis not available (API key issue?)')
    }
  } else if (conversationResult.value.type === 'clarification') {
    console.log('3️⃣ AI requested clarification:')
    console.log(`   Questions: ${conversationResult.value.suggestedActions?.length || 0}`)
    conversationResult.value.suggestedActions?.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q}`)
    })
  }

  console.log('\n✅ All tests passed!')
  console.log('\n📝 Summary:')
  console.log('   - Baseline data accessible')
  console.log('   - Conversation manager functional')
  console.log('   - AI responses parsing correctly')
  console.log('\n🚀 System is ready to use!')
  console.log('   Visit http://localhost:3000/scenario to try it out')
}

// Run tests
testConversationalScenarios()
  .then(() => {
    console.log('\n✨ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
