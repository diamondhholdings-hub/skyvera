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

        return err(new Error(`DM% data extraction failed: ${errorMessage}`))
      }
    },
    { ttl: ttl.FINANCIAL }
  )
}
