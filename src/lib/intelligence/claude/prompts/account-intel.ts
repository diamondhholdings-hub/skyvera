/**
 * Account intelligence prompt builder
 * Generates prompts for customer intelligence analysis
 */

export interface CustomerFinancials {
  customerName: string
  arr: number
  nrr: number
  margin?: number
  renewalStatus?: string
  rank?: number
  totalRevenue?: number
}

export interface NewsArticle {
  title: string
  source: string
  date: string
  summary: string
  url?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
}

export function buildAccountIntelPrompt(
  customerName: string,
  financialData: CustomerFinancials,
  newsData?: NewsArticle[]
): string {
  const newsSection = newsData && newsData.length > 0
    ? `
RECENT NEWS:
${newsData.map((article, idx) => `
${idx + 1}. ${article.title}
   Source: ${article.source} (${article.date})
   ${article.summary}
   ${article.sentiment ? `Sentiment: ${article.sentiment}` : ''}
`).join('\n')}`
    : 'No recent news available for this customer.'

  return `Analyze the following customer account:

CUSTOMER: ${customerName}

FINANCIAL DATA:
- Annual Recurring Revenue (ARR): $${financialData.arr.toLocaleString()}
- Non-Recurring Revenue (NRR): $${financialData.nrr.toLocaleString()}
${financialData.totalRevenue ? `- Total Revenue: $${financialData.totalRevenue.toLocaleString()}` : ''}
${financialData.margin ? `- Margin: ${financialData.margin.toFixed(1)}%` : ''}
${financialData.renewalStatus ? `- Renewal Status: ${financialData.renewalStatus}` : ''}
${financialData.rank ? `- Customer Rank: #${financialData.rank}` : ''}

${newsSection}

ANALYSIS REQUIRED:

1. **Executive Summary**: Provide a 2-3 sentence overview of this customer's current state

2. **Risk Assessment**:
   - Evaluate overall risk level: LOW, MEDIUM, or HIGH
   - Identify specific risks (revenue decline, renewal uncertainty, competitive threats, etc.)

3. **Growth Opportunities**:
   - Identify expansion opportunities (upsell, cross-sell, new use cases)
   - Consider recent news context if available

4. **Recommended Actions**:
   - Specific, actionable next steps for account management
   - Priority order (P0 = urgent, P1 = important, P2 = nice to have)

Return your analysis as valid JSON:
{
  "summary": "Executive summary text",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "risks": [
    {
      "type": "revenue_decline" | "renewal_risk" | "competitive_threat" | "financial_stress" | "other",
      "description": "Specific risk description",
      "severity": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "opportunities": [
    {
      "type": "upsell" | "cross_sell" | "expansion" | "new_use_case" | "other",
      "description": "Specific opportunity description",
      "estimatedValue": "Potential ARR impact (numeric or range)"
    }
  ],
  "recommendedActions": [
    {
      "priority": "P0" | "P1" | "P2",
      "action": "Specific action description",
      "owner": "Who should do this (e.g., 'Account Manager', 'Executive Sponsor')"
    }
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}`
}
