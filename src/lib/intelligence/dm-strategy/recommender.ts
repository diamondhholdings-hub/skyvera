/**
 * DM% Strategy Engine - Recommendation Generator
 * Uses Claude to generate creative, account-specific recommendations
 */

import { Result, ok, err } from '@/lib/types/result'
import { getOrchestrator } from '../claude/orchestrator'
import {
  DMRecommendation,
  ClaudeRecommendationResponse,
  ClaudeRecommendationResponseSchema,
} from './types'
import {
  DM_STRATEGY_SYSTEM_PROMPT,
  ACCOUNT_RECOMMENDATION_PROMPT,
} from '../claude/prompts/dm-strategy'
import { prioritizeRecommendations } from './prioritizer'

interface RecommendationContext {
  currentDM: number
  projectedDM: number
  currentARR: number
  atRisk: boolean
  riskFactors: string[]
  hasGrowthOpportunity: boolean
  opportunityFactors: string[]
  bu: string
  healthScore: string | null
  subscriptions: Array<{
    arr: number | null
    renewalQtr: string | null
    willRenew: string | null
    projectedArr: number | null
  }>
}

/**
 * Generate AI-powered DM% improvement recommendations for a single account.
 *
 * Builds a rich prompt from the account's current DM%, ARR, risk factors, and
 * renewal schedule, then sends it to Claude at temperature 0.8 for creative
 * diversity. The raw response is parsed, validated against
 * `ClaudeRecommendationResponseSchema`, converted to `DMRecommendation` objects,
 * and then re-prioritised by `prioritizeRecommendations`.
 *
 * All recommendations are initialised with `priority: 'medium'` — the prioritiser
 * overwrites this based on impact, confidence, and urgency signals.
 * `recommendationId` is stamped with a timestamp + index to ensure uniqueness
 * across multiple generation calls for the same account.
 *
 * @param accountName  Customer name as it appears in the Skyvera database
 * @param context      Financial and risk context for the account
 * @returns            Result containing prioritised recommendations, or an error
 *                     if Claude is unavailable or response parsing fails
 */
export async function generateRecommendations(
  accountName: string,
  context: RecommendationContext
): Promise<Result<DMRecommendation[]>> {
  try {
    const orchestrator = getOrchestrator()

    // Build prompt with account context
    const prompt = ACCOUNT_RECOMMENDATION_PROMPT({
      accountName,
      ...context,
    })

    // Request recommendations from Claude
    const response = await orchestrator.processRequest({
      prompt,
      systemPrompt: DM_STRATEGY_SYSTEM_PROMPT,
      priority: 'MEDIUM',
      maxTokens: 4096,
      temperature: 0.8, // Higher temperature for creative recommendations
      cacheKey: `dm-recommendations:${accountName}:${Date.now()}`, // No caching for recommendations
    })

    if (!response.success) {
      return err(response.error)
    }

    // Parse Claude's JSON response
    let claudeResponse: ClaudeRecommendationResponse
    try {
      // Extract JSON from response (in case Claude adds markdown)
      const content = response.value.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      claudeResponse = ClaudeRecommendationResponseSchema.parse(parsed)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', response.value.content)
      return err(
        new Error(
          `Failed to parse recommendations: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        )
      )
    }

    // Convert Claude's recommendations to DMRecommendation format
    const recommendations: DMRecommendation[] = claudeResponse.recommendations.map(
      (rec, idx) => ({
        recommendationId: `${accountName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${idx}`,
        accountName,
        bu: context.bu,
        type: rec.type,
        priority: 'medium', // Will be recalculated by prioritizer
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        impact: {
          arrImpact: rec.expectedImpact.arrImpact,
          dmImpact: rec.expectedImpact.dmImpact,
          marginImpact: rec.expectedImpact.marginImpact,
          confidenceLevel: rec.confidence,
        },
        timeline: rec.timeline,
        ownerTeam: rec.ownerTeam,
        risk: rec.risk,
        status: 'pending',
      })
    )

    // Prioritize recommendations based on impact/confidence/urgency
    const prioritizedRecommendations = prioritizeRecommendations(recommendations)

    return ok(prioritizedRecommendations)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to generate recommendations')
    )
  }
}

/**
 * Generate strategic recommendations that span multiple accounts within a BU.
 *
 * Unlike `generateRecommendations` which focuses on one account, this function
 * reasons across the whole portfolio to surface pattern-based actions: e.g.
 * "5 telecom accounts need the same integration feature" or
 * "re-price the bottom decile of Kandy accounts to improve overall DM%".
 *
 * The prompt explicitly lists top at-risk and top opportunity accounts so Claude
 * can reason about cross-account prioritisation and resource allocation.
 * Portfolio-level recommendations are assigned `accountName: 'Portfolio'`.
 *
 * @param context  BU-level portfolio summary including risk and opportunity account lists
 * @returns        Result containing 3–5 prioritised portfolio recommendations
 */
export async function generatePortfolioRecommendations(
  context: {
    bu: string
    totalAccounts: number
    atRiskAccounts: number
    totalARRAtRisk: number
    growthAccounts: number
    currentDM: number
    topRiskAccounts: Array<{ accountName: string; arr: number; dm: number }>
    topOpportunityAccounts: Array<{ accountName: string; arr: number; dm: number }>
  }
): Promise<Result<DMRecommendation[]>> {
  try {
    const orchestrator = getOrchestrator()

    // Build portfolio prompt
    const prompt = `Analyze this portfolio and generate strategic recommendations to improve overall DM% performance.

**PORTFOLIO OVERVIEW:**
Business Unit: ${context.bu}
Total Accounts: ${context.totalAccounts}
Portfolio DM%: ${context.currentDM.toFixed(1)}%
Target DM%: 90%

**RISK PROFILE:**
At-Risk Accounts: ${context.atRiskAccounts} (${((context.atRiskAccounts / context.totalAccounts) * 100).toFixed(1)}%)
Total ARR at Risk: $${context.totalARRAtRisk.toLocaleString()}

Top Risk Accounts:
${context.topRiskAccounts.map((a) => `- ${a.accountName}: $${a.arr.toLocaleString()} ARR, ${a.dm.toFixed(1)}% DM`).join('\n')}

**OPPORTUNITY PROFILE:**
Growth Accounts: ${context.growthAccounts} (${((context.growthAccounts / context.totalAccounts) * 100).toFixed(1)}%)

Top Opportunity Accounts:
${context.topOpportunityAccounts.map((a) => `- ${a.accountName}: $${a.arr.toLocaleString()} ARR, ${a.dm.toFixed(1)}% DM`).join('\n')}

**YOUR TASK:**
Generate 3-5 portfolio-level strategic recommendations. Think about:
1. Pattern-based interventions (e.g., "5 telecom accounts all need same feature")
2. Resource allocation (e.g., "Assign dedicated CSM to top 10 at-risk accounts")
3. Pricing strategy (e.g., "Standardize pricing across similar account tiers")
4. Product roadmap priorities (e.g., "Build X feature to retain 3 high-value accounts")
5. Competitive response (e.g., "Counter Salesforce in enterprise segment")

Be strategic. Think across accounts. Model the aggregate impact.

Return JSON only (no markdown, no text outside JSON).`

    const response = await orchestrator.processRequest({
      prompt,
      systemPrompt: DM_STRATEGY_SYSTEM_PROMPT,
      priority: 'MEDIUM',
      maxTokens: 4096,
      temperature: 0.8,
    })

    if (!response.success) {
      return err(response.error)
    }

    // Parse response
    let claudeResponse: ClaudeRecommendationResponse
    try {
      const content = response.value.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      claudeResponse = ClaudeRecommendationResponseSchema.parse(parsed)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', response.value.content)
      return err(
        new Error(
          `Failed to parse recommendations: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        )
      )
    }

    // Convert to DMRecommendation format
    const recommendations: DMRecommendation[] = claudeResponse.recommendations.map(
      (rec, idx) => ({
        recommendationId: `portfolio-${context.bu.toLowerCase()}-${Date.now()}-${idx}`,
        accountName: 'Portfolio', // Portfolio-level recommendation
        bu: context.bu,
        type: rec.type,
        priority: 'medium',
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        impact: {
          arrImpact: rec.expectedImpact.arrImpact,
          dmImpact: rec.expectedImpact.dmImpact,
          marginImpact: rec.expectedImpact.marginImpact,
          confidenceLevel: rec.confidence,
        },
        timeline: rec.timeline,
        ownerTeam: rec.ownerTeam,
        risk: rec.risk,
        status: 'pending',
      })
    )

    const prioritizedRecommendations = prioritizeRecommendations(recommendations)

    return ok(prioritizedRecommendations)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to generate portfolio recommendations')
    )
  }
}
