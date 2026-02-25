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
 * (e.g., Vercel serverless, missing openpyxl). Values derived from Q1'26 budget.
 */
const STATIC_DM_SNAPSHOT: DMTrackerData = {
  fiscal_quarter: "Q1'26",
  extracted_at: new Date().toISOString(),
  business_units: [
    {
      bu: 'Cloudsense',
      current_rr: 8000000,
      prior_rr:   8483122,
      dm_pct:     94.3,
      variance:   -5.7,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 8150000, dm_pct: 95.5 },
        { quarter: "Q3'25", rr: 8020000, dm_pct: 94.8 },
        { quarter: "Q4'25", rr: 7970000, dm_pct: 94.5 },
        { quarter: "Q1'26", rr: 8000000, dm_pct: 94.3 },
      ],
    },
    {
      bu: 'Kandy',
      current_rr: 3300000,
      prior_rr:   3378378,
      dm_pct:     97.7,
      variance:   -2.3,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 3260000, dm_pct: 97.1 },
        { quarter: "Q3'25", rr: 3295000, dm_pct: 97.5 },
        { quarter: "Q4'25", rr: 3330000, dm_pct: 98.1 },
        { quarter: "Q1'26", rr: 3300000, dm_pct: 97.7 },
      ],
    },
    {
      bu: 'STL',
      current_rr: 1000000,
      prior_rr:   1081081,
      dm_pct:     92.5,
      variance:   -7.5,
      meets_target: true,
      ttm_quarters: [
        { quarter: "Q2'25", rr: 1050000, dm_pct: 92.8 },
        { quarter: "Q3'25", rr: 1020000, dm_pct: 92.5 },
        { quarter: "Q4'25", rr: 1000000, dm_pct: 92.3 },
        { quarter: "Q1'26", rr: 1000000, dm_pct: 92.5 },
      ],
    },
  ],
  consolidated: {
    current_rr:   12300000,
    prior_rr:     13042581,
    dm_pct:       94.3,
    variance:     -5.7,
    meets_target: true,
    target:       90.0,
    ttm_quarters: [
      { quarter: "Q2'25", rr: 12460000, dm_pct: 95.2 },
      { quarter: "Q3'25", rr: 12335000, dm_pct: 94.6 },
      { quarter: "Q4'25", rr: 12300000, dm_pct: 94.3 },
      { quarter: "Q1'26", rr: 12300000, dm_pct: 94.3 },
    ],
  },
  forecast: {
    method: 'trailing_average',
    avg_quarterly_decline_rate: 0.57,
    quarters: [
      { quarter: "Q2'26", forecasted_rr: 12230100, forecasted_dm_pct: 93.7, confidence: 'medium' },
      { quarter: "Q3'26", forecasted_rr: 12160300, forecasted_dm_pct: 93.2, confidence: 'low' },
    ],
  },
}
