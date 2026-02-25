/**
 * DM% Strategy Engine - Main Export
 * Revenue retention recommendation system
 */

// Types
export * from './types'

// Constants
export { DM_CONSTANTS, DM_THRESHOLDS, DM_SCENARIOS, DM_SENSITIVITY_TABLE } from './constants'

// Analyzer
export {
  analyzeAccount,
  analyzePortfolio,
  identifyAtRiskAccounts,
  identifyGrowthOpportunities,
  classifyDMScenario,
  checkThresholdViolations,
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
  calculateDMComponents,
  projectDM10Year,
  calculateBreakevenIceMelt,
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
