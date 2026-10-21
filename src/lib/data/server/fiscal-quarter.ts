/**
 * Current fiscal quarter, read from the `fiscalQuarter` field the Excel parser
 * writes into src/data/skyvera-snapshot.json (e.g. "Q4'26", taken from the
 * workbook's "Q4'26 BU Plan" header). Keeps UI quarter labels in step with the
 * loaded budget instead of hardcoding them.
 */
import { join } from 'path'
import { readFileSync } from 'fs'

let cached: string | null | undefined

/** Raw label like "Q4'26", or null if the snapshot doesn't carry one. */
export function getFiscalQuarter(): string | null {
  if (cached !== undefined) return cached
  try {
    const raw = readFileSync(join(process.cwd(), 'src', 'data', 'skyvera-snapshot.json'), 'utf-8')
    const label = (JSON.parse(raw) as { fiscalQuarter?: unknown }).fiscalQuarter
    cached = typeof label === 'string' ? label : null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[fiscal-quarter] Failed to read snapshot:', error)
    }
    cached = null
  }
  return cached
}

/** Display form, e.g. "Q4'26" -> "Q4 2026". Empty string when unknown. */
export function getFiscalQuarterLabel(): string {
  const match = getFiscalQuarter()?.match(/^Q([1-4])'(\d{2})$/)
  return match ? `Q${match[1]} 20${match[2]}` : ''
}
