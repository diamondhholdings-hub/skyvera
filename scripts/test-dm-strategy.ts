/**
 * Test script for DM% Strategy Engine
 * Runs analysis and generates recommendations for sample accounts
 */

import { analyzeAccount, analyzePortfolio } from '@/lib/intelligence/dm-strategy/analyzer'
import { projectScenario } from '@/lib/intelligence/dm-strategy/impact-calculator'
import { prioritizeRecommendations } from '@/lib/intelligence/dm-strategy/prioritizer'

async function main() {
  console.log('🚀 DM% Strategy Engine Test\n')

  // Test 1: Analyze single account
  console.log('📊 Test 1: Single Account Analysis')
  console.log('=====================================\n')

  const accountName = 'Telstra Corporation'
  console.log(`Analyzing: ${accountName}`)

  const accountResult = await analyzeAccount(accountName)

  if (!accountResult.success) {
    console.error('❌ Account analysis failed:', accountResult.error.message)
  } else {
    const analysis = accountResult.value
    console.log(`\n✅ Analysis Complete:`)
    console.log(`   Account: ${analysis.accountName}`)
    console.log(`   BU: ${analysis.bu}`)
    console.log(`   Current ARR: $${analysis.currentARR.toLocaleString()}`)
    console.log(`   Current DM%: ${analysis.currentDM.toFixed(1)}%`)
    console.log(`   Target DM%: ${analysis.targetDM}%`)
    console.log(`   At Risk: ${analysis.atRisk ? '⚠️ YES' : '✅ NO'}`)

    if (analysis.riskFactors.length > 0) {
      console.log(`\n   Risk Factors:`)
      analysis.riskFactors.forEach((factor) => {
        console.log(`   - ${factor}`)
      })
    }

    if (analysis.opportunityFactors.length > 0) {
      console.log(`\n   Opportunities:`)
      analysis.opportunityFactors.forEach((factor) => {
        console.log(`   - ${factor}`)
      })
    }

    console.log(`\n   📋 Recommendations (${analysis.recommendations.length}):`)
    analysis.recommendations.forEach((rec, idx) => {
      console.log(`\n   ${idx + 1}. ${rec.title}`)
      console.log(`      Priority: ${rec.priority.toUpperCase()}`)
      console.log(`      Type: ${rec.type}`)
      console.log(`      ARR Impact: $${rec.impact.arrImpact.toLocaleString()}`)
      console.log(`      DM Impact: ${rec.impact.dmImpact >= 0 ? '+' : ''}${rec.impact.dmImpact.toFixed(1)}%`)
      console.log(`      Confidence: ${rec.impact.confidenceLevel}%`)
      console.log(`      Timeline: ${rec.timeline}`)
      console.log(`      Owner: ${rec.ownerTeam}`)
      console.log(`      Risk: ${rec.risk}`)
      console.log(`      Description: ${rec.description}`)
    })

    console.log(`\n   Projected ARR Impact: $${analysis.projectedARRImpact.toLocaleString()}`)
  }

  // Test 2: Analyze portfolio (Cloudsense)
  console.log('\n\n📊 Test 2: Portfolio Analysis (Cloudsense)')
  console.log('=====================================\n')

  const portfolioResult = await analyzePortfolio('Cloudsense')

  if (!portfolioResult.success) {
    console.error('❌ Portfolio analysis failed:', portfolioResult.error.message)
  } else {
    const portfolio = portfolioResult.value
    console.log(`\n✅ Portfolio Analysis Complete:`)
    console.log(`   BU: ${portfolio.bu}`)
    console.log(`   Total Accounts: ${portfolio.totalAccounts}`)
    console.log(`   Accounts Analyzed: ${portfolio.accountsAnalyzed}`)
    console.log(`   Current DM%: ${portfolio.currentDM.toFixed(1)}%`)
    console.log(`   Target DM%: ${portfolio.targetDM}%`)
    console.log(`   At-Risk Accounts: ${portfolio.atRiskAccounts} (${((portfolio.atRiskAccounts / portfolio.totalAccounts) * 100).toFixed(1)}%)`)
    console.log(`   Total ARR at Risk: $${portfolio.totalARRAtRisk.toLocaleString()}`)
    console.log(`   Growth Accounts: ${portfolio.growthAccounts} (${((portfolio.growthAccounts / portfolio.totalAccounts) * 100).toFixed(1)}%)`)
    console.log(`   Total ARR Opportunity: $${portfolio.totalARROpportunity.toLocaleString()}`)

    console.log(`\n   📋 Recommendations Summary:`)
    console.log(`   Total Recommendations: ${portfolio.totalRecommendations}`)

    console.log(`\n   By Type:`)
    Object.entries(portfolio.recommendationsByType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`)
    })

    console.log(`\n   By Priority:`)
    Object.entries(portfolio.recommendationsByPriority).forEach(([priority, count]) => {
      console.log(`   - ${priority}: ${count}`)
    })

    console.log(`\n   💰 Projected Impact (if all accepted):`)
    console.log(`   Total ARR Impact: $${portfolio.projectedARRImpact.toLocaleString()}`)
    console.log(`   DM% Improvement: ${portfolio.projectedDMImprovement >= 0 ? '+' : ''}${portfolio.projectedDMImprovement.toFixed(1)}%`)
    console.log(`   Projected DM%: ${(portfolio.currentDM + portfolio.projectedDMImprovement).toFixed(1)}%`)

    // Show top 5 recommendations
    const allRecs = portfolio.accountAnalyses.flatMap((a) => a.recommendations)
    const prioritized = prioritizeRecommendations(allRecs).slice(0, 5)

    console.log(`\n   🔥 Top 5 Recommendations:`)
    prioritized.forEach((rec, idx) => {
      console.log(`\n   ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`)
      console.log(`      Account: ${rec.accountName}`)
      console.log(`      ARR Impact: $${rec.impact.arrImpact.toLocaleString()}`)
      console.log(`      Confidence: ${rec.impact.confidenceLevel}%`)
    })
  }

  // Test 3: Scenario projection
  console.log('\n\n📊 Test 3: Scenario Projection')
  console.log('=====================================\n')

  if (portfolioResult.success) {
    const portfolio = portfolioResult.value
    const allRecs = portfolio.accountAnalyses.flatMap((a) => a.recommendations)

    const scenarioResult = await projectScenario(allRecs, 'Cloudsense')

    if (!scenarioResult.success) {
      console.error('❌ Scenario projection failed:', scenarioResult.error.message)
    } else {
      const scenario = scenarioResult.value
      console.log(`\n✅ Scenario Projection:`)
      console.log(`   Recommendations Included: ${scenario.recommendationsIncluded}`)
      console.log(`   Confidence: ${scenario.confidence}`)

      console.log(`\n   Baseline:`)
      console.log(`   - Total ARR: $${scenario.baseline.totalARR.toLocaleString()}`)
      console.log(`   - Avg DM%: ${scenario.baseline.avgDM.toFixed(1)}%`)
      console.log(`   - Total Revenue: $${scenario.baseline.totalRevenue.toLocaleString()}`)

      console.log(`\n   Projected:`)
      console.log(`   - Total ARR: $${scenario.projected.totalARR.toLocaleString()}`)
      console.log(`   - Avg DM%: ${scenario.projected.avgDM.toFixed(1)}%`)
      console.log(`   - Total Revenue: $${scenario.projected.totalRevenue.toLocaleString()}`)

      console.log(`\n   Impact:`)
      console.log(`   - ARR Change: $${scenario.impact.arrChange.toLocaleString()} (${scenario.impact.arrChangePercent >= 0 ? '+' : ''}${scenario.impact.arrChangePercent.toFixed(1)}%)`)
      console.log(`   - DM Change: ${scenario.impact.dmChange >= 0 ? '+' : ''}${scenario.impact.dmChange.toFixed(1)}% (${scenario.impact.dmChangePercent >= 0 ? '+' : ''}${scenario.impact.dmChangePercent.toFixed(1)}%)`)
    }
  }

  console.log('\n\n✅ DM% Strategy Engine Test Complete!\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
