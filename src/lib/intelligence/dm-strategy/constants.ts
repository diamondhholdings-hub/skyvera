/**
 * DM% Strategy - Financial Model Constants
 * Single source of truth aligned with the Jigtree DM Financial Model
 * All values derived from: Copy of Jigtree_ DM_Financial_Model.xlsx
 */

// ── Pricing Tiers ─────────────────────────────────────────────────────────────
export const DM_CONSTANTS = {
  pricing: {
    standardRate: 0.25,              // 25% increase at renewal
    platinumRate: 0.45,              // 45% increase at renewal
    platinumMixPct: 0.25,            // 25% of ARR is Platinum tier (20–30% range)
    blendedRate: 0.30,               // 75% × 25% + 25% × 45% = 30%
  },
  contractMix: {
    annual: 0.65,                    // 65% 1-year contracts
    threeYear: 0.20,                 // 20% 3-year contracts
    fiveYear: 0.15,                  // 15% 5-year contracts
    percentRenewingPerYear: 0.7467,  // 74.67% of book renews annually
    effectiveAnnualRepricing: 0.224, // blendedRate × renewing% = 22.4%
  },
  breakeven: {
    // At 6% expansion + 31.37% ice melt → DM = exactly 90% (operating floor)
    iceMeltAtFloor: 0.3137,
  },
} as const

// ── DM Thresholds (Monthly / Quarterly / Annual) ──────────────────────────────
export const DM_THRESHOLDS = {
  monthly: {
    floor: 99.2,
    target: 99.5,
    redFlagTrigger: 99.0,      // 2 consecutive months below → CS review within 48 hrs
    redFlagConsecutive: 2,
    action: 'CS review within 48 hours',
  },
  quarterly: {
    floor: 97.5,
    target: 98.0,
    redFlagTrigger: 97.0,      // Single quarter below → CEO-led reset calls
    action: 'CEO-led reset calls',
  },
  annual: {
    floor: 90.0,
    target: 95.0,
    redFlagTrigger: 90.0,      // TTM below floor → full turnaround program
    action: 'Full turnaround program',
  },
} as const

// ── Four Scenarios A / B / C / D ──────────────────────────────────────────────
export const DM_SCENARIOS = {
  A: {
    key: 'A' as const,
    label: 'Collapsing',
    dmMin: 0,
    dmMax: 89.99,
    iceMeltRate: 0.366,        // 36.6% ice melt rate
    description: 'Customer base melting fast — immediate intervention required',
    verdict: 'Melting fast, unacceptable',
    color: '#DC2626',          // Red
  },
  B: {
    key: 'B' as const,
    label: 'Melting Ice Cube',
    dmMin: 90.0,
    dmMax: 99.99,
    iceMeltRate: 0.265,        // 26.5% ice melt rate
    description: 'Above floor but slowly eroding — proactive defense needed',
    verdict: 'Slowly eroding, at risk',
    color: '#F59E0B',          // Amber
  },
  C: {
    key: 'C' as const,
    label: 'Stable',
    dmMin: 100.0,
    dmMax: 114.99,
    iceMeltRate: 0.22,         // 22% ice melt rate
    description: 'Low melt + expansion = growing base',
    verdict: 'Healthy and growing',
    color: '#10B981',          // Emerald
  },
  D: {
    key: 'D' as const,
    label: 'Cash Machine',
    dmMin: 115.0,
    dmMax: Infinity,
    iceMeltRate: 0.20,         // 20% ice melt rate
    description: 'All levers working — price, upsell, cross-sell, new biz firing',
    verdict: 'Cash machine',
    color: '#6366F1',          // Indigo
  },
} as const

// ── Sensitivity Table: Annual DM → Quarterly / Monthly ────────────────────────
// Derived from compounding math: annualDM^(1/4) = quarterlyDM, annualDM^(1/12) = monthlyDM
export const DM_SENSITIVITY_TABLE = [
  { annualDM: 80,  quarterlyDM: 94.6, monthlyDM: 98.2, verdict: 'Melting fast, unacceptable' },
  { annualDM: 85,  quarterlyDM: 96.0, monthlyDM: 98.7, verdict: 'Below floor' },
  { annualDM: 90,  quarterlyDM: 97.4, monthlyDM: 99.1, verdict: 'FLOOR' },
  { annualDM: 95,  quarterlyDM: 98.7, monthlyDM: 99.6, verdict: 'Healthy' },
  { annualDM: 100, quarterlyDM: 100.0, monthlyDM: 100.0, verdict: 'Breakeven' },
  { annualDM: 110, quarterlyDM: 102.4, monthlyDM: 100.8, verdict: 'Strong growth' },
  { annualDM: 115, quarterlyDM: 103.6, monthlyDM: 101.2, verdict: 'Cash machine' },
] as const
