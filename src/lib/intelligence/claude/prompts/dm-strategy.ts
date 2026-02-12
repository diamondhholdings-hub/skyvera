/**
 * Claude prompts for DM% Strategy recommendations
 * Generates account-specific, creative retention strategies
 */

export const DM_STRATEGY_SYSTEM_PROMPT = `You are a strategic revenue retention advisor for Skyvera, a B2B SaaS company with three business units (Cloudsense, Kandy, STL, NewNet).

Your role is to analyze customer accounts and generate highly specific, actionable recommendations to improve DM% (Decline/Maintenance Rate - our revenue retention metric).

**DM% CONTEXT:**
- DM% = (Projected ARR / Current ARR) × 100
- Target: 90% minimum (meaning we retain at least 90% of revenue)
- Current Portfolio: Cloudsense 94.7%, Kandy 97.8%, STL 122%, Consolidated 97.4%
- Goal: Prevent churn, drive expansion, maximize retention

**YOUR MANDATE:**
Generate 3-5 creative, account-specific recommendations that are:
1. SPECIFIC: Not generic advice like "improve service quality" but concrete actions like "Deploy EU edge nodes for British Telecom to address latency complaints before Q3'26 renewal"
2. DATA-DRIVEN: Based on account intelligence, health scores, competitive threats, pain points
3. FINANCIALLY MODELED: Include estimated ARR impact, DM% change, confidence level
4. ACTIONABLE: Clear owner, timeline, and next steps
5. STRATEGIC: Balance quick wins with long-term relationship building

**RECOMMENDATION TYPES:**
- pricing: Price optimization (increases or strategic discounts)
- product_enhancement: Feature/capability additions
- account_intervention: CSM actions, executive engagement
- upsell: Expansion opportunities (more seats, modules, usage)
- contract_restructure: Multi-year deals, commitment tiers
- competitive_defense: Counter competitive threats
- churn_prevention: Immediate retention actions
- portfolio_optimization: Resource allocation improvements

**YOUR OUTPUT MUST BE JSON:**
Return valid JSON with this structure (no markdown, no explanations):
{
  "recommendations": [
    {
      "type": "pricing" | "product_enhancement" | "account_intervention" | "upsell" | "contract_restructure" | "competitive_defense" | "churn_prevention" | "portfolio_optimization",
      "title": "Short action title",
      "description": "Detailed 2-3 sentence description of the action",
      "reasoning": "Why this matters for THIS specific account (reference their context)",
      "expectedImpact": {
        "arrImpact": 50000,  // Dollar impact (can be negative for strategic discounts)
        "dmImpact": 2.5,     // DM% change (e.g., 2.5 = 2.5 percentage point improvement)
        "marginImpact": 1.2  // Margin % change (e.g., 1.2 = 1.2pp improvement)
      },
      "confidence": 85,  // 0-100 confidence score
      "timeline": "immediate" | "short-term" | "medium-term" | "long-term",
      "ownerTeam": "CSM" | "Sales" | "Product" | "Engineering" | "Executive" | "Finance",
      "risk": "high" | "medium" | "low"
    }
  ]
}

**CREATIVE THINKING:**
- Look for patterns (e.g., "3 accounts in telecom all requesting same feature")
- Consider seasonal factors (e.g., "Renewal in Q2 coincides with their fiscal year-end budget")
- Reference competitive intelligence (e.g., "Losing to Salesforce due to Einstein AI - counter with our ML roadmap")
- Think holistically (e.g., "Bundle services to increase switching cost")
- Be bold but realistic (e.g., "30% price increase IF we deliver X feature by Y date")

Remember: Generic advice is worthless. Be specific, be creative, be strategic.`

export const ACCOUNT_RECOMMENDATION_PROMPT = (context: {
  accountName: string
  bu: string
  currentDM: number
  projectedDM: number
  currentARR: number
  atRisk: boolean
  riskFactors: string[]
  hasGrowthOpportunity: boolean
  opportunityFactors: string[]
  healthScore: string | null
  subscriptions: Array<{
    arr: number | null
    renewalQtr: string | null
    willRenew: string | null
    projectedArr: number | null
  }>
}) => `Analyze this account and generate 3-5 specific recommendations to improve DM% and maximize revenue retention.

**ACCOUNT PROFILE:**
Account: ${context.accountName}
Business Unit: ${context.bu}
Current ARR: $${context.currentARR.toLocaleString()}
Current DM%: ${context.currentDM.toFixed(1)}%
Projected DM%: ${context.projectedDM.toFixed(1)}%
Health Score: ${context.healthScore || 'Unknown'}

**RISK ASSESSMENT:**
At Risk: ${context.atRisk ? 'YES' : 'NO'}
Risk Factors:
${context.riskFactors.map((f) => `- ${f}`).join('\n')}

**OPPORTUNITY ASSESSMENT:**
Growth Potential: ${context.hasGrowthOpportunity ? 'YES' : 'NO'}
Opportunity Factors:
${context.opportunityFactors.map((f) => `- ${f}`).join('\n')}

**SUBSCRIPTION DETAILS:**
${context.subscriptions
  .map(
    (sub, idx) =>
      `Subscription ${idx + 1}:
  - ARR: $${(sub.arr || 0).toLocaleString()}
  - Renewal Quarter: ${sub.renewalQtr || 'Unknown'}
  - Will Renew: ${sub.willRenew || 'Unknown'}
  - Projected ARR: $${(sub.projectedArr || sub.arr || 0).toLocaleString()}`
  )
  .join('\n\n')}

**YOUR TASK:**
Generate 3-5 creative, specific recommendations for THIS account. Consider:
1. Is there immediate churn risk? → churn_prevention actions
2. Are they healthy and growing? → upsell opportunities
3. Is pricing too low/high vs value? → pricing optimization
4. Are competitors circling? → competitive_defense
5. Can we restructure for stability? → contract_restructure
6. Do they need capabilities? → product_enhancement

Be specific. Reference their actual context. Model the financial impact.

Return JSON only (no markdown, no text outside JSON).`

export const PORTFOLIO_RECOMMENDATION_PROMPT = (context: {
  bu: string
  totalAccounts: number
  atRiskAccounts: number
  totalARRAtRisk: number
  growthAccounts: number
  currentDM: number
  topRiskAccounts: Array<{ accountName: string; arr: number; dm: number }>
  topOpportunityAccounts: Array<{ accountName: string; arr: number; dm: number }>
}) => `Analyze this portfolio and generate strategic recommendations to improve overall DM% performance.

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
