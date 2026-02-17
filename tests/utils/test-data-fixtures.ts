/**
 * Test Data Fixtures
 *
 * Consistent test data for E2E tests
 */

export const TEST_CUSTOMERS = {
  BRITISH_TELECOM: {
    name: 'British Telecom',
    displayName: 'British Telecom',
    bu: 'Cloudsense',
    health: 'Healthy',
    expectedRR: 500000, // $500K+
  },
  VODAFONE: {
    name: 'Vodafone',
    displayName: 'Vodafone Group',
    bu: 'Cloudsense',
    health: 'At Risk',
  },
  ORANGE: {
    name: 'Orange',
    displayName: 'Orange',
    bu: 'Cloudsense',
    health: 'Healthy',
  },
} as const

export const TEST_BUSINESS_UNITS = {
  CLOUDSENSE: 'Cloudsense',
  KANDY: 'Kandy',
  STL: 'STL',
} as const

export const EXPECTED_TABS = [
  'Overview',
  'Financials',
  'Organization',
  'Strategy',
  'Competitive',
  'Intelligence',
  'Action Items',
  'Technographics',
] as const

export const TEST_SELECTORS = {
  // Dashboard
  dashboard: {
    totalRevenue: /Total Revenue.*Q1'26/i,
    netMargin: /Net Margin|EBITDA/i,
    businessUnits: /Cloudsense|Kandy|STL/i,
    accountsLink: 'a[href="/accounts"]',
  },

  // Accounts page
  accounts: {
    pageTitle: /Accounts|Customer Intelligence/i,
    searchInput: 'input[placeholder*="Search"]',
    accountRow: '[role="row"]',
    healthIndicator: '[aria-label*="health"], [title*="health"]',
  },

  // Account plan page
  accountPlan: {
    pageHeading: /Customer Account Plans|Account Intelligence/i,
    backLink: 'a[href="/accounts"]',
    tabPanel: '[role="tabpanel"]',
    tabButton: (tabName: string) => `button:has-text("${tabName}")`,
    mobileTabSelect: '#tab-select',
  },

  // DM Strategy
  dmStrategy: {
    liveDataIndicator: 'text=Live Data',
    businessUnitCard: (bu: string) => `text=${bu}`,
    recommendation: '[data-testid="recommendation"]',
  },
} as const

/**
 * Get a test customer by search term
 *
 * Useful for consistent test data access
 */
export function getTestCustomer(searchTerm: keyof typeof TEST_CUSTOMERS) {
  return TEST_CUSTOMERS[searchTerm]
}

/**
 * Get expected KPI values for validation
 *
 * These are approximate values from the Q1'26 budget
 */
export const EXPECTED_KPIS = {
  totalRevenue: {
    min: 14_000_000, // $14M
    max: 15_000_000, // $15M
  },
  recurringRevenue: {
    min: 12_000_000, // $12M
    max: 13_000_000, // $13M
  },
  netMargin: {
    min: 0.6, // 60%
    max: 0.7, // 70%
  },
  customerCount: {
    min: 130,
    max: 150,
  },
} as const

/**
 * Common timeout values for different operations
 */
export const TIMEOUTS = {
  hydration: 10000, // Client component hydration
  navigation: 5000, // Page navigation
  apiCall: 15000, // API requests (especially Claude)
  networkIdle: 10000, // Network idle wait
  content: 5000, // Content appearance
  animation: 500, // CSS animations/transitions
} as const
