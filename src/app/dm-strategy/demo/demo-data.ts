import type { BusinessUnitMetrics, MonthlyDMData, DMThresholdViolation } from '../types';
import { DM_THRESHOLDS } from '@/lib/intelligence/dm-strategy/constants';

// Historical DM% data (Feb 2025 - Jan 2026)
export const cloudsenseHistory: MonthlyDMData[] = [
  { month: 'Feb 25', dmPercent: 95.2, revenue: 8050000, targetDM: 95.0 },
  { month: 'Mar 25', dmPercent: 95.8, revenue: 8100000, targetDM: 95.0 },
  { month: 'Apr 25', dmPercent: 96.1, revenue: 8150000, targetDM: 95.0 },
  { month: 'May 25', dmPercent: 95.5, revenue: 8080000, targetDM: 95.0 },
  { month: 'Jun 25', dmPercent: 94.9, revenue: 8020000, targetDM: 95.0 },
  { month: 'Jul 25', dmPercent: 94.3, revenue: 7980000, targetDM: 95.0 },
  { month: 'Aug 25', dmPercent: 94.8, revenue: 8010000, targetDM: 95.0 },
  { month: 'Sep 25', dmPercent: 94.5, revenue: 7995000, targetDM: 95.0 },
  { month: 'Oct 25', dmPercent: 94.2, revenue: 7970000, targetDM: 95.0 },
  { month: 'Nov 25', dmPercent: 94.0, revenue: 7955000, targetDM: 95.0 },
  { month: 'Dec 25', dmPercent: 93.8, revenue: 7940000, targetDM: 95.0 },
  { month: 'Jan 26', dmPercent: 93.2, revenue: 7890000, targetDM: 95.0 },
];

export const kandyHistory: MonthlyDMData[] = [
  { month: 'Feb 25', dmPercent: 96.5, revenue: 3250000, targetDM: 95.0 },
  { month: 'Mar 25', dmPercent: 96.8, revenue: 3260000, targetDM: 95.0 },
  { month: 'Apr 25', dmPercent: 97.1, revenue: 3275000, targetDM: 95.0 },
  { month: 'May 25', dmPercent: 97.3, revenue: 3285000, targetDM: 95.0 },
  { month: 'Jun 25', dmPercent: 97.5, revenue: 3295000, targetDM: 95.0 },
  { month: 'Jul 25', dmPercent: 97.8, revenue: 3305000, targetDM: 95.0 },
  { month: 'Aug 25', dmPercent: 98.0, revenue: 3315000, targetDM: 95.0 },
  { month: 'Sep 25', dmPercent: 98.1, revenue: 3320000, targetDM: 95.0 },
  { month: 'Oct 25', dmPercent: 98.3, revenue: 3328000, targetDM: 95.0 },
  { month: 'Nov 25', dmPercent: 98.4, revenue: 3332000, targetDM: 95.0 },
  { month: 'Dec 25', dmPercent: 98.6, revenue: 3338000, targetDM: 95.0 },
  { month: 'Jan 26', dmPercent: 98.5, revenue: 3335000, targetDM: 95.0 },
];

export const stlHistory: MonthlyDMData[] = [
  { month: 'Feb 25', dmPercent: 92.8, revenue: 995000, targetDM: 95.0 },
  { month: 'Mar 25', dmPercent: 92.5, revenue: 990000, targetDM: 95.0 },
  { month: 'Apr 25', dmPercent: 92.7, revenue: 993000, targetDM: 95.0 },
  { month: 'May 25', dmPercent: 92.4, revenue: 988000, targetDM: 95.0 },
  { month: 'Jun 25', dmPercent: 92.6, revenue: 991000, targetDM: 95.0 },
  { month: 'Jul 25', dmPercent: 92.3, revenue: 987000, targetDM: 95.0 },
  { month: 'Aug 25', dmPercent: 92.5, revenue: 990000, targetDM: 95.0 },
  { month: 'Sep 25', dmPercent: 92.4, revenue: 989000, targetDM: 95.0 },
  { month: 'Oct 25', dmPercent: 92.6, revenue: 991000, targetDM: 95.0 },
  { month: 'Nov 25', dmPercent: 92.3, revenue: 988000, targetDM: 95.0 },
  { month: 'Dec 25', dmPercent: 92.1, revenue: 986000, targetDM: 95.0 },
  { month: 'Jan 26', dmPercent: 91.8, revenue: 983000, targetDM: 95.0 },
];

// Helper to build threshold violations from model-correct DM values
function makeViolations(monthly: number, quarterly: number, annual: number): DMThresholdViolation[] {
  return [
    {
      period: 'monthly',
      value: monthly,
      floor: DM_THRESHOLDS.monthly.floor,
      target: DM_THRESHOLDS.monthly.target,
      isViolation: monthly < DM_THRESHOLDS.monthly.floor,
      isRedFlag: monthly < DM_THRESHOLDS.monthly.redFlagTrigger,
    },
    {
      period: 'quarterly',
      value: quarterly,
      floor: DM_THRESHOLDS.quarterly.floor,
      target: DM_THRESHOLDS.quarterly.target,
      isViolation: quarterly < DM_THRESHOLDS.quarterly.floor,
      isRedFlag: quarterly < DM_THRESHOLDS.quarterly.redFlagTrigger,
    },
    {
      period: 'annual',
      value: annual,
      floor: DM_THRESHOLDS.annual.floor,
      target: DM_THRESHOLDS.annual.target,
      isViolation: annual < DM_THRESHOLDS.annual.floor,
      isRedFlag: annual < DM_THRESHOLDS.annual.redFlagTrigger,
    },
  ]
}

export const sampleBusinessUnits: BusinessUnitMetrics[] = [
  {
    // Cloudsense: ttm=94.7% → Scenario B (Melting Ice Cube)
    // Monthly/quarterly derived from sensitivity table interpolation
    name: 'Cloudsense',
    currentDM: 94.7,
    monthlyDM: 99.6,    // model-correct: interpolated from sensitivity table (94.7% annual)
    quarterlyDM: 98.6,  // model-correct: interpolated from sensitivity table
    ttmDM: 94.7,
    annualDM: 94.7,
    targetDM: 95.0,
    trend: 'down',
    trendValue: -0.3,
    arr: 8000000,
    accountCount: 65,
    recommendationCount: 5,
    color: '#0066A1',
    history: cloudsenseHistory,
    scenario: 'B',
    thresholdViolations: makeViolations(99.6, 98.6, 94.7),
  },
  {
    // Kandy: ttm=97.8% → Scenario B (Melting Ice Cube, but near breakeven)
    name: 'Kandy',
    currentDM: 97.8,
    monthlyDM: 99.8,    // model-correct: interpolated from sensitivity table (97.8% annual)
    quarterlyDM: 99.4,  // model-correct: interpolated from sensitivity table
    ttmDM: 97.8,
    annualDM: 97.8,
    targetDM: 95.0,
    trend: 'up',
    trendValue: 0.5,
    arr: 3300000,
    accountCount: 45,
    recommendationCount: 4,
    color: '#00B8D4',
    history: kandyHistory,
    scenario: 'B',
    thresholdViolations: makeViolations(99.8, 99.4, 97.8),
  },
  {
    // STL: ttm=92.5% → Scenario B (Melting Ice Cube)
    name: 'STL',
    currentDM: 92.5,
    monthlyDM: 99.4,    // model-correct: interpolated from sensitivity table (92.5% annual)
    quarterlyDM: 98.1,  // model-correct: interpolated from sensitivity table
    ttmDM: 92.5,
    annualDM: 92.5,
    targetDM: 95.0,
    trend: 'neutral',
    trendValue: 0.0,
    arr: 1000000,
    accountCount: 30,
    recommendationCount: 3,
    color: '#27AE60',
    history: stlHistory,
    scenario: 'B',
    thresholdViolations: makeViolations(99.4, 98.1, 92.5),
  },
];
