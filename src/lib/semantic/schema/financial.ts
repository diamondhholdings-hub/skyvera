/**
 * Metric definitions as single source of truth for all business metrics
 * Provides calculation rules, formulas, and human-readable descriptions for Claude prompts
 */

export interface MetricDefinition {
  name: string
  displayName: string
  description: string // Human-readable for Claude prompts
  formula: string // How it's calculated
  unit: 'currency' | 'percentage' | 'count' | 'ratio'
  source: string // Which data source (Excel sheet name)
  calculate: (data: Record<string, number>) => number // Actual calculation function
}

/**
 * Core metric definitions - single source of truth for all calculations
 * These definitions are used by:
 * 1. SemanticResolver for actual metric calculations
 * 2. Claude orchestrator for prompt enrichment (understanding what metrics mean)
 * 3. UI components for displaying metric descriptions and units
 */
export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  ARR: {
    name: 'ARR',
    displayName: 'Annual Recurring Revenue',
    description:
      'Annual Recurring Revenue represents predictable subscription revenue annualized. Calculated as Quarterly RR × 4. This is the most critical metric for SaaS businesses as it represents the foundation of predictable revenue.',
    formula: 'Quarterly RR × 4',
    unit: 'currency',
    source: 'Excel RR Summary sheet',
    calculate: (data) => {
      if (typeof data.quarterlyRR !== 'number') {
        throw new Error('quarterlyRR is required to calculate ARR')
      }
      return data.quarterlyRR * 4
    },
  },

  EBITDA: {
    name: 'EBITDA',
    displayName: 'EBITDA',
    description:
      'Earnings Before Interest, Taxes, Depreciation, and Amortization. Represents operating profitability before financial and accounting adjustments. Calculated as Total Revenue - COGS - Operating Expenses.',
    formula: 'Total Revenue - COGS - OpEx',
    unit: 'currency',
    source: 'Excel P&Ls sheet',
    calculate: (data) => {
      if (
        typeof data.totalRevenue !== 'number' ||
        typeof data.cogs !== 'number' ||
        typeof data.opex !== 'number'
      ) {
        throw new Error('totalRevenue, cogs, and opex are required to calculate EBITDA')
      }
      return data.totalRevenue - data.cogs - data.opex
    },
  },

  NetMargin: {
    name: 'NetMargin',
    displayName: 'Net Margin %',
    description:
      'Net Margin represents the percentage of revenue remaining after all costs. Calculated as (Revenue - All Costs) / Revenue × 100. Higher margins indicate more efficient operations.',
    formula: '(Revenue - All Costs) / Revenue × 100',
    unit: 'percentage',
    source: 'Excel P&Ls sheet',
    calculate: (data) => {
      if (typeof data.totalRevenue !== 'number' || typeof data.totalCosts !== 'number') {
        throw new Error('totalRevenue and totalCosts are required to calculate NetMargin')
      }
      if (data.totalRevenue === 0) return 0
      return ((data.totalRevenue - data.totalCosts) / data.totalRevenue) * 100
    },
  },

  GrossMargin: {
    name: 'GrossMargin',
    displayName: 'Gross Margin %',
    description:
      'Gross Margin represents the percentage of revenue remaining after direct costs (COGS). Calculated as (Revenue - COGS) / Revenue × 100. Measures production efficiency.',
    formula: '(Revenue - COGS) / Revenue × 100',
    unit: 'percentage',
    source: 'Excel P&Ls sheet',
    calculate: (data) => {
      if (typeof data.totalRevenue !== 'number' || typeof data.cogs !== 'number') {
        throw new Error('totalRevenue and cogs are required to calculate GrossMargin')
      }
      if (data.totalRevenue === 0) return 0
      return ((data.totalRevenue - data.cogs) / data.totalRevenue) * 100
    },
  },

  TotalRevenue: {
    name: 'TotalRevenue',
    displayName: 'Total Revenue',
    description:
      'Total Revenue is the sum of Recurring Revenue (RR) and Non-Recurring Revenue (NRR) for a business unit. RR is predictable subscription revenue, NRR is one-time services or licenses.',
    formula: 'RR + NRR',
    unit: 'currency',
    source: 'Excel RR Summary and NRR Summary sheets',
    calculate: (data) => {
      if (typeof data.rr !== 'number' || typeof data.nrr !== 'number') {
        throw new Error('rr and nrr are required to calculate TotalRevenue')
      }
      return data.rr + data.nrr
    },
  },

  CustomerCount: {
    name: 'CustomerCount',
    displayName: 'Customer Count',
    description:
      'Number of active customers in a business unit. Active customers are those with current subscriptions or recent revenue.',
    formula: 'COUNT(active customers)',
    unit: 'count',
    source: 'Customer data from Excel and Salesforce',
    calculate: (data) => {
      if (typeof data.customerCount !== 'number') {
        throw new Error('customerCount is required')
      }
      return data.customerCount
    },
  },

  RRDecline: {
    name: 'RRDecline',
    displayName: 'RR Change vs Prior Plan',
    description:
      'Change in Recurring Revenue compared to the previous plan. Negative values indicate revenue contraction (churn), positive values indicate growth. Critical metric for assessing business health.',
    formula: 'Current RR - Prior Plan RR',
    unit: 'currency',
    source: 'Excel RR Summary sheet (Current vs Prior columns)',
    calculate: (data) => {
      if (typeof data.currentRR !== 'number' || typeof data.priorRR !== 'number') {
        throw new Error('currentRR and priorRR are required to calculate RRDecline')
      }
      return data.currentRR - data.priorRR
    },
  },
}

/**
 * Get human-readable definition for a specific metric (used in Claude prompts)
 */
export function getMetricDefinition(name: string): string {
  const metric = METRIC_DEFINITIONS[name]
  if (!metric) {
    return `Unknown metric: ${name}`
  }
  return `${metric.displayName}: ${metric.description} Formula: ${metric.formula}. Source: ${metric.source}`
}

/**
 * Get ALL metric definitions formatted for Claude system prompt injection
 * This helps Claude understand what each metric means when answering user queries
 */
export function getAllMetricDefinitions(): string {
  const definitions = Object.values(METRIC_DEFINITIONS)
    .map(
      (metric) =>
        `**${metric.displayName} (${metric.name})**\n` +
        `Description: ${metric.description}\n` +
        `Formula: ${metric.formula}\n` +
        `Unit: ${metric.unit}\n` +
        `Source: ${metric.source}\n`
    )
    .join('\n')

  return `# Business Metrics Reference\n\nThe following metrics are available in the Skyvera system:\n\n${definitions}`
}
