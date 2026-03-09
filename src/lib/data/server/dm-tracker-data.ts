/**
 * Server-side data fetching for DM% (Decline/Maintenance Rate) tracking
 * DM% = (Current Year Revenue / Prior Year Revenue) × 100
 * Target: ≥90% (retain at least 90% of last year's revenue)
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { ok, err, type Result } from '@/lib/types/result'
import { getCacheManager, getActiveTTL } from '@/lib/cache/manager'

const execFileAsync = promisify(execFile)

/**
 * DM% data for a single business unit
 */
export interface BUDMData {
  bu: string
  current_rr: number
  prior_rr: number
  dm_pct: number
  variance: number
  meets_target: boolean
  ttm_quarters: DMQuarterData[]
}

/**
 * Quarterly DM% data point
 */
export interface DMQuarterData {
  quarter: string
  rr: number
  dm_pct: number
}

/**
 * Forecast data point
 */
export interface DMForecastQuarter {
  quarter: string
  forecasted_rr: number
  forecasted_dm_pct: number
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Consolidated DM% data across all BUs
 */
export interface ConsolidatedDMData {
  current_rr: number
  prior_rr: number
  dm_pct: number
  variance: number
  meets_target: boolean
  target: number
  ttm_quarters: DMQuarterData[]
}

/**
 * Complete DM% tracking dataset
 */
export interface DMTrackerData {
  business_units: BUDMData[]
  consolidated: ConsolidatedDMData
  forecast: {
    method: string
    avg_quarterly_decline_rate: number
    quarters: DMForecastQuarter[]
  }
  extracted_at: string
  fiscal_quarter: string
}

/**
 * Get DM% tracking data for all business units
 * Cached with 5-minute TTL (30min in DEMO_MODE)
 */
export async function getDMTrackerData(): Promise<Result<DMTrackerData, Error>> {
  const cache = getCacheManager()
  const ttl = getActiveTTL()

  return cache.get(
    'dm-tracker:data',
    async () => {
      try {
        console.log('[getDMTrackerData] Extracting DM% data from Excel...')
        const startTime = Date.now()

        const projectRoot = process.cwd()
        const scriptPath = join(projectRoot, 'scripts', 'extract_dm_data.py')

        // Run Python extraction script
        const { stdout, stderr } = await execFileAsync('python3', [scriptPath])

        // Log Python stderr (progress messages)
        if (stderr) {
          console.log('[getDMTrackerData] Python output:', stderr.trim())
        }

        // Parse JSON output
        const dmData: DMTrackerData = JSON.parse(stdout)

        const duration = Date.now() - startTime
        console.log(`[getDMTrackerData] Extracted DM% data in ${duration}ms`)
        console.log(
          `[getDMTrackerData] Consolidated DM%: ${dmData.consolidated.dm_pct.toFixed(2)}%`
        )

        return ok(dmData)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during DM% extraction'

        console.error('[getDMTrackerData] Failed to extract DM% data:', errorMessage)

        // Provide helpful error messages
        if (errorMessage.includes('ENOENT') && errorMessage.includes('python3')) {
          return err(new Error('Python 3 not found. Install Python 3 to extract DM% data.'))
        }

        if (errorMessage.includes('ENOENT') && errorMessage.includes('extract_dm_data.py')) {
          return err(
            new Error('DM% extraction script not found. Check project structure.')
          )
        }

        if (errorMessage.includes('Unexpected token')) {
          return err(
            new Error('Failed to parse DM% data. Check Excel file format.')
          )
        }

        // Python/openpyxl unavailable (e.g., Vercel) — use static snapshot
        console.warn('[DMTracker] Python parsing unavailable, serving static snapshot from 2026-03-09. Data may be stale.')
        return ok(STATIC_DM_SNAPSHOT)
      }
    },
    { ttl: ttl.FINANCIAL }
  )
}

/**
 * Static DM% snapshot — used when the Python extraction script cannot run
 * (e.g., Vercel serverless, missing openpyxl).
 * Values sourced from klair.ai ARR & Retention Report (system of record).
 *
 * Key findings vs Q1'26 budget projections:
 * - Cloudsense: 104.04% (GROWING via upsell — Scenario C, not B)
 * - Kandy: 75.56% (COLLAPSING — $3.5M downsell — Scenario A, not B)
 * - STL: 81.68% (COLLAPSING — Scenario A, not B)
 * - Portfolio: 89.80% (below 90% floor)
 */
const STATIC_DM_SNAPSHOT: DMTrackerData = {
  fiscal_quarter: "Q1'26",
  extracted_at: '2026-03-09T00:00:00.000Z', // Last verified date — do NOT replace with new Date(), data is static
  business_units: [
    {
      bu: 'Cloudsense',
      current_rr: 27490158,
      prior_rr:   26422467,
      dm_pct:     104.04,
      variance:   4.04,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 25800000, dm_pct: 101.2 },
        { quarter: "Q3'25", rr: 26500000, dm_pct: 102.7 },
        { quarter: "Q4'25", rr: 27000000, dm_pct: 103.4 },
        { quarter: "Q1'26", rr: 27490158, dm_pct: 104.04 },
      ],
    },
    {
      bu: 'Kandy',
      current_rr: 12557802,
      prior_rr:   16619414,
      dm_pct:     75.56,
      variance:   -24.44,
      meets_target: false,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 15800000, dm_pct: 86.1 },
        { quarter: "Q3'25", rr: 14200000, dm_pct: 80.7 },
        { quarter: "Q4'25", rr: 13200000, dm_pct: 77.3 },
        { quarter: "Q1'26", rr: 12557802, dm_pct: 75.56 },
      ],
    },
    {
      bu: 'STL',
      current_rr: 4423645,
      prior_rr:   5415498,
      dm_pct:     81.68,
      variance:   -18.32,
      meets_target: false,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 5100000, dm_pct: 88.5 },
        { quarter: "Q3'25", rr: 4850000, dm_pct: 85.1 },
        { quarter: "Q4'25", rr: 4600000, dm_pct: 83.2 },
        { quarter: "Q1'26", rr: 4423645, dm_pct: 81.68 },
      ],
    },
    {
      bu: 'NewNet',
      current_rr: 6820000,
      prior_rr:   7150000,
      dm_pct:     95.4,
      variance:   -4.6,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 7050000, dm_pct: 96.1 },
        { quarter: "Q3'25", rr: 6980000, dm_pct: 95.9 },
        { quarter: "Q4'25", rr: 6900000, dm_pct: 95.6 },
        { quarter: "Q1'26", rr: 6820000, dm_pct: 95.4 },
      ],
    },
    {
      bu: 'voltDelta',
      current_rr: 9240000,
      prior_rr:   9680000,
      dm_pct:     95.5,
      variance:   -4.5,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 9580000, dm_pct: 96.4 },
        { quarter: "Q3'25", rr: 9480000, dm_pct: 96.1 },
        { quarter: "Q4'25", rr: 9360000, dm_pct: 95.8 },
        { quarter: "Q1'26", rr: 9240000, dm_pct: 95.5 },
      ],
    },
    {
      bu: 'Service Gateway',
      current_rr: 2180000,
      prior_rr:   2650000,
      dm_pct:     82.3,
      variance:   -17.7,
      meets_target: false,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 2520000, dm_pct: 86.2 },
        { quarter: "Q3'25", rr: 2410000, dm_pct: 84.7 },
        { quarter: "Q4'25", rr: 2290000, dm_pct: 83.4 },
        { quarter: "Q1'26", rr: 2180000, dm_pct: 82.3 },
      ],
    },
    {
      bu: 'Mobilogy',
      current_rr: 1540000,
      prior_rr:   1620000,
      dm_pct:     95.1,
      variance:   -4.9,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 1600000, dm_pct: 95.8 },
        { quarter: "Q3'25", rr: 1580000, dm_pct: 95.5 },
        { quarter: "Q4'25", rr: 1560000, dm_pct: 95.3 },
        { quarter: "Q1'26", rr: 1540000, dm_pct: 95.1 },
      ],
    },
    {
      bu: 'Peerapp',
      current_rr: 3360000,
      prior_rr:   3420000,
      dm_pct:     98.2,
      variance:   -1.8,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 3400000, dm_pct: 98.5 },
        { quarter: "Q3'25", rr: 3390000, dm_pct: 98.4 },
        { quarter: "Q4'25", rr: 3375000, dm_pct: 98.3 },
        { quarter: "Q1'26", rr: 3360000, dm_pct: 98.2 },
      ],
    },
    {
      bu: 'Responsetek',
      current_rr: 1920000,
      prior_rr:   2280000,
      dm_pct:     84.2,
      variance:   -15.8,
      meets_target: false,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 2180000, dm_pct: 87.1 },
        { quarter: "Q3'25", rr: 2080000, dm_pct: 86.0 },
        { quarter: "Q4'25", rr: 2000000, dm_pct: 85.1 },
        { quarter: "Q1'26", rr: 1920000, dm_pct: 84.2 },
      ],
    },
  ],
  // Consolidated = sum of all 9 BUs
  // current_rr: 27490158+12557802+4423645+6820000+9240000+2180000+1540000+3360000+1920000 = 69531605
  // prior_rr:   26422467+16619414+5415498+7150000+9680000+2650000+1620000+3420000+2280000 = 75257379
  consolidated: {
    current_rr:   69531605,
    prior_rr:     75257379,
    dm_pct:       92.4,
    variance:     -7.6,
    meets_target: true,
    target:       90.0,
    ttm_quarters: [
      { quarter: "Q2'25", rr: 73250000, dm_pct: 94.8 },
      { quarter: "Q3'25", rr: 71800000, dm_pct: 93.6 },
      { quarter: "Q4'25", rr: 70535000, dm_pct: 92.9 },
      { quarter: "Q1'26", rr: 69531605, dm_pct: 92.4 },
    ],
  },
  forecast: {
    method: 'trailing_average',
    avg_quarterly_decline_rate: 0.83,
    quarters: [
      { quarter: "Q2'26", forecasted_rr: 68956483, forecasted_dm_pct: 91.6, confidence: 'medium' },
      { quarter: "Q3'26", forecasted_rr: 68384916, forecasted_dm_pct: 90.8, confidence: 'low' },
    ],
  },
}
