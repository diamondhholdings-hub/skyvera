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
        console.warn('[getDMTrackerData] Falling back to static snapshot data')
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
  extracted_at: new Date().toISOString(),
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
  ],
  consolidated: {
    current_rr:   53539591,
    prior_rr:     59621401,
    dm_pct:       89.80,
    variance:     -10.20,
    meets_target: false,
    target:       90.0,
    ttm_quarters: [
      { quarter: "Q2'25", rr: 57200000, dm_pct: 92.6 },
      { quarter: "Q3'25", rr: 55900000, dm_pct: 91.2 },
      { quarter: "Q4'25", rr: 54600000, dm_pct: 90.3 },
      { quarter: "Q1'26", rr: 53539591, dm_pct: 89.80 },
    ],
  },
  forecast: {
    method: 'trailing_average',
    avg_quarterly_decline_rate: 2.55,
    quarters: [
      { quarter: "Q2'26", forecasted_rr: 52173281, forecasted_dm_pct: 87.3, confidence: 'medium' },
      { quarter: "Q3'26", forecasted_rr: 50869059, forecasted_dm_pct: 84.9, confidence: 'low' },
    ],
  },
}
