/**
 * DM% Strategy Engine - Main Export
 * Revenue retention recommendation system
 */

// Types
export * from './types'

// Analyzer
export {
  analyzeAccount,
  analyzePortfolio,
  identifyAtRiskAccounts,
  identifyGrowthOpportunities,
} from './analyzer'

// Recommender
export {
  generateRecommendations,
  generatePortfolioRecommendations,
} from './recommender'

// Impact Calculator
export {
  calculateARRImpact,
  calculateDMImpact,
  calculateMarginImpact,
  projectScenario,
  calculateROI,
  calculatePaybackPeriod,
  rankByExpectedValue,
  groupByType,
} from './impact-calculator'

// Prioritizer
export {
  prioritizeRecommendations,
  filterByPriority,
  getTopRecommendations,
  groupByPriority,
  calculateAggregateImpactByPriority,
  suggestNextActions,
} from './prioritizer'
