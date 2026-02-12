/**
 * DM% Strategy Engine - Account Analysis
 * Analyzes accounts for DM% risks and opportunities
 */

import { Result, ok, err } from '@/lib/types/result'
import { prisma } from '@/lib/db/prisma'
import {
  AccountDMAnalysis,
  PortfolioDMAnalysis,
  DMRecommendation,
} from './types'
import { generateRecommendations } from './recommender'

interface AccountWithIntelligence {
  customerName: string
  bu: string
  rr: number
  nrr: number
  totalRevenue: number
  healthScore: string | null
  subscriptions: Array<{
    arr: number | null
    renewalQtr: string | null
    willRenew: string | null
    projectedArr: number | null
  }>
}

/**
 * Analyze single account for DM% risks and opportunities
 */
export async function analyzeAccount(
  accountName: string
): Promise<Result<AccountDMAnalysis>> {
  try {
    // Fetch account data
    const account = await prisma.customer.findUnique({
      where: { customerName: accountName },
      include: {
        subscriptions: true,
      },
    })

    if (!account) {
      return err(new Error(`Account not found: ${accountName}`))
    }

    // Calculate current DM% (using subscriptions)
    const currentARR = account.subscriptions.reduce(
      (sum, sub) => sum + (sub.arr || 0),
      0
    )
    const projectedARR = account.subscriptions.reduce(
      (sum, sub) => sum + (sub.projectedArr || sub.arr || 0),
      0
    )

    const currentDM = currentARR > 0 ? (projectedARR / currentARR) * 100 : 100
    const projectedDM = currentDM // For now, same as current (can be enhanced with trend analysis)

    // Assess risk
    const riskFactors: string[] = []
    const atRisk =
      currentDM < 90 ||
      account.healthScore === 'red' ||
      account.healthScore === 'yellow'

    if (currentDM < 90) {
      riskFactors.push(`DM% below target (${currentDM.toFixed(1)}% vs 90%)`)
    }
    if (account.healthScore === 'red') {
      riskFactors.push('Poor health score (red)')
    }
    if (account.healthScore === 'yellow') {
      riskFactors.push('Moderate health score (yellow)')
    }

    // Check for upcoming renewals
    const upcomingRenewals = account.subscriptions.filter(
      (sub) =>
        sub.renewalQtr &&
        (sub.renewalQtr.includes('Q2') ||
          sub.renewalQtr.includes('Q3') ||
          sub.renewalQtr.includes('Q4'))
    )
    if (upcomingRenewals.length > 0) {
      riskFactors.push(
        `${upcomingRenewals.length} subscription(s) renewing soon`
      )
    }

    // Check for non-renewal flags
    const nonRenewals = account.subscriptions.filter(
      (sub) =>
        sub.willRenew &&
        (sub.willRenew.toLowerCase().includes('no') ||
          sub.willRenew.toLowerCase().includes('tbd'))
    )
    if (nonRenewals.length > 0) {
      riskFactors.push(`${nonRenewals.length} at-risk renewal(s)`)
    }

    // Assess growth opportunities
    const opportunityFactors: string[] = []
    const hasGrowthOpportunity =
      account.healthScore === 'green' ||
      currentDM > 95 ||
      account.totalRevenue > 100000

    if (account.healthScore === 'green') {
      opportunityFactors.push('Strong health score (green)')
    }
    if (currentDM > 95) {
      opportunityFactors.push(
        `High retention rate (${currentDM.toFixed(1)}%)`
      )
    }
    if (account.totalRevenue > 100000) {
      opportunityFactors.push(
        `High-value account ($${(account.totalRevenue / 1000).toFixed(0)}K)`
      )
    }

    // Generate AI-powered recommendations
    const recommendationsResult = await generateRecommendations(
      accountName,
      {
        currentDM,
        projectedDM,
        currentARR,
        atRisk,
        riskFactors,
        hasGrowthOpportunity,
        opportunityFactors,
        bu: account.bu,
        healthScore: account.healthScore,
        subscriptions: account.subscriptions,
      }
    )

    if (!recommendationsResult.success) {
      console.warn(
        `Failed to generate recommendations for ${accountName}:`,
        recommendationsResult.error
      )
      // Continue with empty recommendations
    }

    const recommendations: DMRecommendation[] = recommendationsResult.success
      ? recommendationsResult.value
      : []

    // Calculate projected ARR impact
    const projectedARRImpact = recommendations.reduce(
      (sum, rec) => sum + rec.impact.arrImpact,
      0
    )

    const analysis: AccountDMAnalysis = {
      accountName,
      bu: account.bu,
      currentDM,
      projectedDM,
      targetDM: 90,
      atRisk,
      riskFactors,
      hasGrowthOpportunity,
      opportunityFactors,
      currentARR,
      projectedARRImpact,
      recommendations,
      analyzedAt: new Date(),
    }

    return ok(analysis)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to analyze account')
    )
  }
}

/**
 * Analyze entire portfolio or specific BU
 */
export async function analyzePortfolio(
  bu?: string
): Promise<Result<PortfolioDMAnalysis>> {
  try {
    const analysisRunId = `run-${Date.now()}`

    // Fetch accounts
    const accounts = await prisma.customer.findMany({
      where: bu ? { bu } : {},
      include: {
        subscriptions: true,
      },
    })

    if (accounts.length === 0) {
      return err(new Error(`No accounts found${bu ? ` for BU: ${bu}` : ''}`))
    }

    // Analyze each account
    const accountAnalyses: AccountDMAnalysis[] = []
    let totalCurrentARR = 0
    let totalProjectedARR = 0
    let atRiskAccounts = 0
    let totalARRAtRisk = 0
    let growthAccounts = 0
    let totalARROpportunity = 0
    const recommendationsByType: Record<string, number> = {}
    const recommendationsByPriority: Record<string, number> = {}

    for (const account of accounts) {
      const analysisResult = await analyzeAccount(account.customerName)
      if (analysisResult.success) {
        const analysis = analysisResult.value
        accountAnalyses.push(analysis)

        totalCurrentARR += analysis.currentARR
        totalProjectedARR +=
          analysis.currentARR * (analysis.projectedDM / 100)

        if (analysis.atRisk) {
          atRiskAccounts++
          totalARRAtRisk += analysis.currentARR
        }

        if (analysis.hasGrowthOpportunity) {
          growthAccounts++
          totalARROpportunity += analysis.projectedARRImpact
        }

        // Count recommendations by type and priority
        for (const rec of analysis.recommendations) {
          recommendationsByType[rec.type] =
            (recommendationsByType[rec.type] || 0) + 1
          recommendationsByPriority[rec.priority] =
            (recommendationsByPriority[rec.priority] || 0) + 1
        }
      }
    }

    // Calculate weighted average DM%
    const currentDM = totalCurrentARR > 0 ? (totalProjectedARR / totalCurrentARR) * 100 : 100
    const projectedDM = currentDM // For now, same as current

    // Calculate total projected impact
    const totalRecommendations = accountAnalyses.reduce(
      (sum, analysis) => sum + analysis.recommendations.length,
      0
    )
    const projectedARRImpact = accountAnalyses.reduce(
      (sum, analysis) => sum + analysis.projectedARRImpact,
      0
    )

    // Estimate DM improvement if all recommendations accepted
    const projectedDMImprovement =
      totalCurrentARR > 0
        ? ((totalProjectedARR + projectedARRImpact) / totalCurrentARR) * 100 -
          currentDM
        : 0

    const portfolioAnalysis: PortfolioDMAnalysis = {
      bu: bu || 'All',
      totalAccounts: accounts.length,
      accountsAnalyzed: accountAnalyses.length,
      currentDM,
      projectedDM,
      targetDM: 90,
      atRiskAccounts,
      totalARRAtRisk,
      growthAccounts,
      totalARROpportunity,
      totalRecommendations,
      recommendationsByType,
      recommendationsByPriority,
      projectedARRImpact,
      projectedDMImprovement,
      accountAnalyses,
      analyzedAt: new Date(),
      analysisRunId,
    }

    return ok(portfolioAnalysis)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to analyze portfolio')
    )
  }
}

/**
 * Identify at-risk accounts (declining DM% or low health)
 */
export async function identifyAtRiskAccounts(
  bu?: string
): Promise<Result<AccountDMAnalysis[]>> {
  try {
    const portfolioResult = await analyzePortfolio(bu)
    if (!portfolioResult.success) {
      return err(portfolioResult.error)
    }

    const atRiskAccounts = portfolioResult.value.accountAnalyses.filter(
      (analysis) => analysis.atRisk
    )

    // Sort by ARR (highest risk first)
    atRiskAccounts.sort((a, b) => b.currentARR - a.currentARR)

    return ok(atRiskAccounts)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to identify at-risk accounts')
    )
  }
}

/**
 * Identify growth opportunities (high health, expansion potential)
 */
export async function identifyGrowthOpportunities(
  bu?: string
): Promise<Result<AccountDMAnalysis[]>> {
  try {
    const portfolioResult = await analyzePortfolio(bu)
    if (!portfolioResult.success) {
      return err(portfolioResult.error)
    }

    const growthAccounts = portfolioResult.value.accountAnalyses.filter(
      (analysis) => analysis.hasGrowthOpportunity
    )

    // Sort by projected impact (highest opportunity first)
    growthAccounts.sort(
      (a, b) => b.projectedARRImpact - a.projectedARRImpact
    )

    return ok(growthAccounts)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to identify growth opportunities')
    )
  }
}
