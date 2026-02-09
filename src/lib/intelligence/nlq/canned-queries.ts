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
      "Get Annual Recurring Revenue (ARR) breakdown by business unit for Q1'26",
    requiredFilters: [],
  },
  {
    id: 'vendor-costs',
    label: 'What are our largest vendor costs?',
    category: 'financials',
    template:
      'List top vendor costs by business unit, focusing on contracts over $50K/quarter',
    requiredFilters: ['bu'],
  },

  // PERFORMANCE
  {
    id: 'margin-gap',
    label: 'Why are we missing our margin target?',
    category: 'performance',
    template:
      "Analyze the margin gap between actual ({netMarginPct}%) and target ({netMarginTarget}%) for {bu} in Q1'26, identifying top cost drivers",
    requiredFilters: ['bu'],
  },
  {
    id: 'rr-decline',
    label: 'Why is recurring revenue declining?',
    category: 'performance',
    template:
      'Analyze the $336K RR decline vs prior plan, break down by business unit and identify root causes',
    requiredFilters: [],
  },
  {
    id: 'ebitda-test',
    label: 'Why did we fail the EBITDA test?',
    category: 'performance',
    template:
      "Explain why the FY'25 EBITDA test failed, showing key contributing factors and the gap to target",
    requiredFilters: [],
  },

  // CUSTOMERS
  {
    id: 'customer-churn-risk',
    label: 'Which customers are at risk of churning?',
    category: 'customers',
    template:
      'Identify customers with red or yellow health scores, sorted by ARR impact',
    requiredFilters: [],
  },

  // COMPARISONS
  {
    id: 'bu-comparison',
    label: 'Compare performance across business units',
    category: 'comparisons',
    template:
      "Compare revenue, margin, and EBITDA across Cloudsense, Kandy, and STL for Q1'26",
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
