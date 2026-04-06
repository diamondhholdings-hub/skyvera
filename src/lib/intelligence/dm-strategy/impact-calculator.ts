/**
 * DM% Strategy Engine - Impact Calculator
 * Financial modeling for recommendation impacts
 */

import { Result, ok, err } from '@/lib/types/result'
import {
  DMRecommendation,
  DMScenarioProjection,
  IceMeltComponents,
  ContractTermMix,
  DMScenarioKey,
} from './types'
import { DM_CONSTANTS, DM_SCENARIOS } from './constants'
import { prisma } from '@/lib/db/prisma'

/**
 * Calculate the risk-adjusted ARR impact of a single recommendation.
 *
 * Applies two discount multipliers to the raw `arrImpact` figure:
 * - **Confidence discount**: `confidenceLevel / 100` (0–1). A recommendation
 *   with 70% confidence retains 70% of its stated ARR impact.
 * - **Risk discount**: high=0.7, medium=0.85, low=1.0. High-risk actions
 *   are discounted an additional 30% to reflect execution uncertainty.
 *
 * The result represents expected value, not best-case impact.
 *
 * @param recommendation  A DM recommendation with pre-populated impact estimates
 * @returns               Risk-adjusted ARR impact in dollars (annual)
 *
 * @example
 * // Raw impact $500K, 80% confidence, medium risk → $500K × 0.8 × 0.85 = $340K
 * calculateARRImpact({ impact: { arrImpact: 500_000, confidenceLevel: 80 }, risk: 'medium' })
 */
export function calculateARRImpact(
  recommendation: DMRecommendation
): number {
  const baseImpact = recommendation.impact.arrImpact

  // Adjust for confidence level (0-100 becomes 0-1 multiplier)
  const confidenceMultiplier = recommendation.impact.confidenceLevel / 100

  // Adjust for risk level
  const riskMultiplier =
    recommendation.risk === 'high' ? 0.7 : recommendation.risk === 'medium' ? 0.85 : 1.0

  return baseImpact * confidenceMultiplier * riskMultiplier
}

/**
 * Calculate the risk-adjusted DM percentage-point improvement from a recommendation.
 *
 * DM% (Decline/Maintenance rate) measures how much of beginning ARR is retained
 * at year-end. A `dmImpact` of +2.5 means DM% moves from e.g. 94.7% → 97.2%.
 * The same confidence and risk discounts applied in `calculateARRImpact` are used here.
 *
 * @param recommendation  DM recommendation with `impact.dmImpact` in percentage points
 * @param currentARR      The account's current ARR (used by callers for context; not
 *                        consumed directly by this function but required by the signature
 *                        to allow future dollar-weighted DM calculations)
 * @returns               Risk-adjusted DM percentage-point change (e.g. 1.8 means +1.8pp)
 */
export function calculateDMImpact(
  recommendation: DMRecommendation,
  currentARR: number
): number {
  // DM impact is the percentage point change
  // For example, +2.5 means DM% goes from 94.7% to 97.2%
  const baseDMImpact = recommendation.impact.dmImpact

  // Adjust for confidence
  const confidenceMultiplier = recommendation.impact.confidenceLevel / 100

  // Adjust for risk
  const riskMultiplier =
    recommendation.risk === 'high' ? 0.7 : recommendation.risk === 'medium' ? 0.85 : 1.0

  return baseDMImpact * confidenceMultiplier * riskMultiplier
}

/**
 * Calculate margin impact of a recommendation
 */
export function calculateMarginImpact(
  recommendation: DMRecommendation
): number {
  const baseMarginImpact = recommendation.impact.marginImpact

  // Adjust for confidence
  const confidenceMultiplier = recommendation.impact.confidenceLevel / 100

  // Adjust for risk
  const riskMultiplier =
    recommendation.risk === 'high' ? 0.7 : recommendation.risk === 'medium' ? 0.85 : 1.0

  return baseMarginImpact * confidenceMultiplier * riskMultiplier
}

/**
 * Project the aggregate ARR and DM% outcome if every supplied recommendation is executed.
 *
 * Fetches live baseline data from the database (filtered by BU if provided), then
 * applies each recommendation's risk-adjusted ARR and DM impacts on top. The resulting
 * `DMScenarioProjection` shows baseline vs. projected state side-by-side.
 *
 * Confidence is bucketed from the average confidenceLevel across all recommendations:
 * ≥80 = HIGH, ≥60 = MEDIUM, <60 = LOW.
 *
 * Note: Revenue projection is simplified — it adds the ARR impact directly to totalRevenue
 * rather than annualising through RR. Suitable for executive "what-if" views.
 *
 * @param recommendations  List of DM recommendations to model (can mix accounts and types)
 * @param bu               Optional BU filter (e.g. 'Kandy'); omit to project across all BUs
 * @returns                Result containing baseline, projected, and delta metrics
 */
export async function projectScenario(
  recommendations: DMRecommendation[],
  bu?: string
): Promise<Result<DMScenarioProjection>> {
  try {
    // Fetch baseline metrics
    const customers = await prisma.customer.findMany({
      where: bu ? { bu } : {},
      include: {
        subscriptions: true,
      },
    })

    // Calculate baseline
    let totalARR = 0
    let totalProjectedARR = 0
    let totalRevenue = 0

    for (const customer of customers) {
      const arr = customer.subscriptions.reduce(
        (sum, sub) => sum + (sub.arr || 0),
        0
      )
      const projectedArr = customer.subscriptions.reduce(
        (sum, sub) => sum + (sub.projectedArr || sub.arr || 0),
        0
      )

      totalARR += arr
      totalProjectedARR += projectedArr
      totalRevenue += customer.totalRevenue
    }

    const baselineDM = totalARR > 0 ? (totalProjectedARR / totalARR) * 100 : 100

    // Calculate projected impact from recommendations
    let totalARRImpact = 0
    let totalDMImpact = 0

    for (const rec of recommendations) {
      // Find the account
      const account = customers.find(
        (c) => c.customerName === rec.accountName
      )
      if (!account) continue

      const accountARR = account.subscriptions.reduce(
        (sum, sub) => sum + (sub.arr || 0),
        0
      )

      totalARRImpact += calculateARRImpact(rec)
      totalDMImpact += calculateDMImpact(rec, accountARR)
    }

    // Calculate projected state
    const projectedTotalARR = totalARR + totalARRImpact
    const projectedTotalProjectedARR = totalProjectedARR + totalARRImpact
    const projectedDM =
      projectedTotalARR > 0
        ? (projectedTotalProjectedARR / projectedTotalARR) * 100
        : 100

    // Determine confidence level
    const avgConfidence =
      recommendations.reduce(
        (sum, rec) => sum + rec.impact.confidenceLevel,
        0
      ) / recommendations.length

    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
      avgConfidence >= 80 ? 'HIGH' : avgConfidence >= 60 ? 'MEDIUM' : 'LOW'

    const projection: DMScenarioProjection = {
      baseline: {
        totalARR,
        avgDM: baselineDM,
        totalRevenue,
      },
      projected: {
        totalARR: projectedTotalARR,
        avgDM: projectedDM,
        totalRevenue: totalRevenue + totalARRImpact, // Simplified
      },
      impact: {
        arrChange: totalARRImpact,
        arrChangePercent: totalARR > 0 ? (totalARRImpact / totalARR) * 100 : 0,
        dmChange: projectedDM - baselineDM,
        dmChangePercent:
          baselineDM > 0 ? ((projectedDM - baselineDM) / baselineDM) * 100 : 0,
      },
      recommendationsIncluded: recommendations.length,
      confidence,
    }

    return ok(projection)
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Failed to project scenario')
    )
  }
}

/**
 * Calculate the annual ROI multiple for a recommendation.
 *
 * ROI = risk-adjusted ARR impact ÷ implementation cost.
 * A result of 5 means the initiative returns $5 in ARR for every $1 spent.
 *
 * When no explicit cost is provided, a proxy is derived from `timeline`:
 * - `immediate`  → $5K   (quick CSM action, e.g. a renewal call)
 * - `short-term` → $15K  (moderate effort, e.g. a QBR + custom deck)
 * - `medium-term`→ $50K  (significant project, e.g. integration work)
 * - `long-term`  → $100K (major initiative, e.g. product roadmap item)
 *
 * @param recommendation              DM recommendation to evaluate
 * @param estimatedImplementationCost Actual cost estimate in dollars; 0 uses timeline proxy
 * @returns                           ROI multiple (e.g. 4.2 = 420% return); Infinity if cost is 0
 */
export function calculateROI(
  recommendation: DMRecommendation,
  estimatedImplementationCost: number = 0
): number {
  const arrImpact = calculateARRImpact(recommendation)

  // If no cost estimate, use timeline as proxy
  let cost = estimatedImplementationCost
  if (cost === 0) {
    // Rough cost estimates based on timeline
    switch (recommendation.timeline) {
      case 'immediate':
        cost = 5000 // Quick CSM action
        break
      case 'short-term':
        cost = 15000 // Moderate effort
        break
      case 'medium-term':
        cost = 50000 // Significant project
        break
      case 'long-term':
        cost = 100000 // Major initiative
        break
    }
  }

  return cost > 0 ? arrImpact / cost : arrImpact
}

/**
 * Calculate how many months it takes to recover the implementation cost from ARR impact.
 *
 * Payback (months) = implementation cost ÷ (risk-adjusted ARR impact ÷ 12).
 * Uses the same timeline-based cost proxies as `calculateROI` when no explicit cost
 * is provided. Returns `Infinity` when monthly impact is zero or negative.
 *
 * @param recommendation              DM recommendation to evaluate
 * @param estimatedImplementationCost Actual cost estimate in dollars; 0 uses timeline proxy
 * @returns                           Payback period in months; Infinity if impact ≤ 0
 */
export function calculatePaybackPeriod(
  recommendation: DMRecommendation,
  estimatedImplementationCost: number = 0
): number {
  const arrImpact = calculateARRImpact(recommendation)
  const monthlyImpact = arrImpact / 12 // Convert ARR to monthly

  let cost = estimatedImplementationCost
  if (cost === 0) {
    // Use same timeline-based estimates
    switch (recommendation.timeline) {
      case 'immediate':
        cost = 5000
        break
      case 'short-term':
        cost = 15000
        break
      case 'medium-term':
        cost = 50000
        break
      case 'long-term':
        cost = 100000
        break
    }
  }

  return monthlyImpact > 0 ? cost / monthlyImpact : Infinity
}

/**
 * Sort recommendations by expected value (EV), highest first.
 *
 * EV = risk-adjusted ARR impact × (confidenceLevel / 100).
 * This double-applies the confidence discount (once inside `calculateARRImpact`,
 * once here), intentionally producing a conservative ranking that surfaces only
 * high-confidence, high-impact actions at the top.
 *
 * Returns a new array — the original is not mutated.
 *
 * @param recommendations  Unsorted list of DM recommendations
 * @returns                New array sorted by EV descending
 */
export function rankByExpectedValue(
  recommendations: DMRecommendation[]
): DMRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const evA =
      calculateARRImpact(a) * (a.impact.confidenceLevel / 100)
    const evB =
      calculateARRImpact(b) * (b.impact.confidenceLevel / 100)
    return evB - evA // Descending order
  })
}

/**
 * Calculate the full one-year DM% waterfall for a given ARR base.
 *
 * Implements the Jigtree DM formula:
 * ```
 * Ending ARR = Beginning ARR
 *            − IceMelt                           (natural attrition)
 *            + Standard price increase            (standard-tier renewals × rate)
 *            + Platinum price increase            (platinum-tier renewals × rate)
 *            + Upsell                             (expansion within existing products)
 *            + Cross-sell                         (new product lines to existing customers)
 *            + New business                       (net-new logos, often 0 in retention models)
 * DM% = Ending ARR / Beginning ARR × 100
 * ```
 *
 * Only the portion of the book renewing in a given year (`percentRenewingPerYear`)
 * is eligible for repricing, so multi-year contract holders provide a natural drag
 * on price-increase capture.
 *
 * @param beginningARR      ARR at the start of the period (dollars)
 * @param iceMeltRate       Gross attrition rate as a decimal (e.g. 0.08 = 8% churn)
 * @param platinumMixPct    Fraction of ARR on Platinum support tier (0–1)
 * @param contractTermMix   Mix of annual/3-year/5-year contracts and % renewing per year
 * @param expansionRates    Upsell, cross-sell, and new-business rates as decimals
 * @returns                 Full waterfall components plus ending ARR and resulting DM%
 *
 * @example
 * // Cloudsense baseline: $8M ARR, 6% ice melt, 20% platinum, 4% upsell
 * calculateDMComponents(8_000_000, 0.06, 0.20, contractMix, { upsell: 0.04, crossSell: 0.02, newBusiness: 0 })
 * // → { iceMelt: 6, endingARR: ~8_160_000, dm: ~102 }
 */
export function calculateDMComponents(
  beginningARR: number,
  iceMeltRate: number,
  platinumMixPct: number,
  contractTermMix: ContractTermMix,
  expansionRates: { upsell: number; crossSell: number; newBusiness: number }
): IceMeltComponents {
  const standardMixPct = 1 - platinumMixPct
  const renewingPct = contractTermMix.percentRenewingPerYear

  const standardPriceIncrease =
    beginningARR * standardMixPct * renewingPct * DM_CONSTANTS.pricing.standardRate
  const platinumPriceIncrease =
    beginningARR * platinumMixPct * renewingPct * DM_CONSTANTS.pricing.platinumRate
  const iceMelt = beginningARR * iceMeltRate
  const upsell = beginningARR * expansionRates.upsell
  const crossSell = beginningARR * expansionRates.crossSell
  const newBusiness = beginningARR * expansionRates.newBusiness

  const endingARR =
    beginningARR -
    iceMelt +
    standardPriceIncrease +
    platinumPriceIncrease +
    upsell +
    crossSell +
    newBusiness

  return {
    iceMelt: iceMeltRate * 100,
    standardPriceIncrease,
    platinumPriceIncrease,
    upsell,
    crossSell,
    newBusiness,
    endingARR,
    dm: beginningARR > 0 ? (endingARR / beginningARR) * 100 : 100,
  }
}

/**
 * Project ARR and DM% over a 10-year horizon for one of the named scenarios (A/B/C/D).
 *
 * Each scenario corresponds to a different ice-melt rate defined in `DM_SCENARIOS`.
 * Expansion is fixed at 4% upsell + 2% cross-sell (no new business) for a conservative
 * retention-only projection. Each year's ending ARR becomes the next year's beginning ARR,
 * compounding the waterfall effect over time.
 *
 * @param beginningARR  Starting ARR for year 1 (dollars)
 * @param scenarioKey   One of the predefined scenario keys ('A' | 'B' | 'C' | 'D')
 * @returns             Array of 10 yearly `IceMeltComponents`, one per year
 */
export function projectDM10Year(
  beginningARR: number,
  scenarioKey: DMScenarioKey
): IceMeltComponents[] {
  const scenario = DM_SCENARIOS[scenarioKey]
  const contractTermMix: ContractTermMix = {
    annual: DM_CONSTANTS.contractMix.annual,
    threeYear: DM_CONSTANTS.contractMix.threeYear,
    fiveYear: DM_CONSTANTS.contractMix.fiveYear,
    percentRenewingPerYear: DM_CONSTANTS.contractMix.percentRenewingPerYear,
    effectiveAnnualRepricing: DM_CONSTANTS.contractMix.effectiveAnnualRepricing,
  }
  const expansionRates = { upsell: 0.04, crossSell: 0.02, newBusiness: 0.00 }

  const projections: IceMeltComponents[] = []
  let arr = beginningARR

  for (let i = 0; i < 10; i++) {
    const components = calculateDMComponents(
      arr,
      scenario.iceMeltRate,
      DM_CONSTANTS.pricing.platinumMixPct,
      contractTermMix,
      expansionRates
    )
    projections.push(components)
    arr = components.endingARR
  }

  return projections
}

/**
 * Solve for the maximum ice-melt (gross churn) rate at which DM% = 100% (break-even).
 *
 * At break-even, the sum of repricing gains and expansion revenue exactly offsets
 * natural attrition. The formula is:
 * ```
 * breakeven iceMelt = (standardMix × renewingPct × standardRate)
 *                   + (platinumMix × renewingPct × platinumRate)
 *                   + expansionRate
 * ```
 * Any ice-melt rate above this threshold results in net ARR decline (DM% < 100%).
 * Useful for stress-testing: "How much churn can Kandy absorb before ARR shrinks?"
 *
 * @param platinumMixPct    Fraction of ARR on Platinum tier (0–1)
 * @param contractTermMix   Contract term distribution and annual renewal percentage
 * @param expansionRate     Combined upsell + cross-sell + new-business rate as a decimal
 * @returns                 Break-even ice-melt rate as a decimal (e.g. 0.072 = 7.2%)
 */
export function calculateBreakevenIceMelt(
  platinumMixPct: number,
  contractTermMix: ContractTermMix,
  expansionRate: number
): number {
  const standardMixPct = 1 - platinumMixPct
  const renewingPct = contractTermMix.percentRenewingPerYear

  const priceIncreaseRate =
    standardMixPct * renewingPct * DM_CONSTANTS.pricing.standardRate +
    platinumMixPct * renewingPct * DM_CONSTANTS.pricing.platinumRate

  // Breakeven: iceMelt = priceIncreaseRate + expansionRate
  return priceIncreaseRate + expansionRate
}

/**
 * Group recommendations by type with aggregate impact
 */
export function groupByType(recommendations: DMRecommendation[]): Record<
  string,
  {
    count: number
    totalARRImpact: number
    avgConfidence: number
    recommendations: DMRecommendation[]
  }
> {
  const grouped: Record<
    string,
    {
      count: number
      totalARRImpact: number
      avgConfidence: number
      recommendations: DMRecommendation[]
    }
  > = {}

  for (const rec of recommendations) {
    if (!grouped[rec.type]) {
      grouped[rec.type] = {
        count: 0,
        totalARRImpact: 0,
        avgConfidence: 0,
        recommendations: [],
      }
    }

    grouped[rec.type].count++
    grouped[rec.type].totalARRImpact += calculateARRImpact(rec)
    grouped[rec.type].avgConfidence += rec.impact.confidenceLevel
    grouped[rec.type].recommendations.push(rec)
  }

  // Calculate averages
  for (const type in grouped) {
    grouped[type].avgConfidence /= grouped[type].count
  }

  return grouped
}
