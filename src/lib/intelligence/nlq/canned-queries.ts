/**
 * Canned query library - pre-programmed business intelligence queries
 * Provides guided templates for common business questions
 */

import { CannedQuery, QueryFilters } from './types'

/**
 * Library of canned queries across 4 business categories
 */
export const CANNED_QUERIES: CannedQuery[] = [
  // FINANCIALS
  {
    id: 'arr-by-bu',
    label: 'What is the ARR for each business unit?',
    category: 'financials',
    template:
      'Get Annual Recurring Revenue (ARR) breakdown by business unit this quarter',
    requiredFilters: [],
  },
  {
    id: 'vendor-costs',
    label: 'What are our largest vendor costs?',
    category: 'financials',
    template:
      "List the largest vendor costs for {bu} this quarter, how each changed against last quarter's forecast, and every vendor over $50K a quarter",
    requiredFilters: ['bu'],
  },
  {
    id: 'cost-vs-model',
    label: 'Where are we spending above the cost model?',
    category: 'financials',
    template:
      'Compare each product line\'s cost structure with the cost model and list the biggest overspends in dollars',
    requiredFilters: [],
  },
  {
    id: 'headcount-cost',
    label: 'What does our headcount cost, and where?',
    category: 'financials',
    template:
      'Break down headcount and people cost by department, business unit and location, compare with last quarter, and include AI tooling cost against a year ago',
    requiredFilters: [],
  },

  // PERFORMANCE
  {
    id: 'margin-gap',
    label: 'Why are we missing our margin target?',
    category: 'performance',
    template:
      "Analyze the margin gap between actual ({netMarginPct}%) and target ({netMarginTarget}%) for {bu} this quarter, identifying top cost drivers",
    requiredFilters: ['bu'],
  },
  {
    id: 'rr-decline',
    label: 'Why is recurring revenue declining?',
    category: 'performance',
    template:
      'Explain the recurring revenue change against prior plan this quarter by business unit, and name the customers and renewals driving it',
    requiredFilters: [],
  },
  {
    id: 'product-margins',
    label: 'Which product lines miss their margin target?',
    category: 'performance',
    template:
      'For each product line, compare net margin with its margin target this quarter and over the next three budget quarters',
    requiredFilters: [],
  },

  // CUSTOMERS
  {
    id: 'customer-churn-risk',
    label: 'Which renewals are at risk?',
    category: 'customers',
    template:
      'List subscriptions marked as not renewing in the next four quarters, sorted by ARR, with any receivables over 90 days for those customers',
    requiredFilters: [],
  },
  {
    id: 'receivables',
    label: 'Who owes us the most past 90 days?',
    category: 'customers',
    template:
      'List the largest receivables over 90 days, whether each exceeds 10% of the customer\'s ARR, and the latest collection status',
    requiredFilters: [],
  },
  {
    id: 'renewal-pipeline',
    label: 'Where does the renewal pipeline stand?',
    category: 'customers',
    template:
      'Summarize the Salesforce renewal pipeline by stage and owner, and flag large opportunities closing in the next two quarters',
    requiredFilters: [],
  },

  // COMPARISONS
  {
    id: 'bu-comparison',
    label: 'Compare performance across business units',
    category: 'comparisons',
    template:
      "Compare revenue, margin, and EBITDA across Cloudsense, Kandy, and STL this quarter",
    requiredFilters: [],
  },
  {
    id: 'margin-trend',
    label: 'How have revenue and margin trended?',
    category: 'comparisons',
    template:
      'Show revenue and net margin by quarter from the year-ago actuals through the coming budget quarters, and explain the biggest moves',
    requiredFilters: [],
  },
]

/**
 * Get a canned query by ID
 */
export function getCannedQueryById(id: string): CannedQuery | undefined {
  return CANNED_QUERIES.find((q) => q.id === id)
}

/**
 * Get canned queries filtered by category
 */
export function getCannedQueriesByCategory(category: string): CannedQuery[] {
  return CANNED_QUERIES.filter((q) => q.category === category)
}

/**
 * Expand template placeholders with actual filter values and metric data
 * Supports: {bu}, {quarter}, {customer}, {netMarginPct}, {netMarginTarget}
 */
export function expandTemplate(
  template: string,
  filters: QueryFilters,
  metrics?: Record<string, number>
): string {
  let expanded = template

  // Replace filter placeholders
  if (filters.bu) {
    expanded = expanded.replace(/{bu}/g, filters.bu)
  }
  if (filters.quarter) {
    expanded = expanded.replace(/{quarter}/g, filters.quarter)
  }
  if (filters.customer) {
    expanded = expanded.replace(/{customer}/g, filters.customer)
  }

  // Replace metric placeholders
  if (metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      const placeholder = new RegExp(`{${key}}`, 'g')
      expanded = expanded.replace(placeholder, value.toString())
    })
  }

  return expanded
}
