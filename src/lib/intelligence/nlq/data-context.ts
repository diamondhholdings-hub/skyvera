/**
 * Data context for natural language queries: the loaded budget's figures,
 * condensed into a compact object that is injected into the NLQ prompt so
 * Claude answers from real numbers instead of reasoning without data.
 *
 * Reads the same pre-built snapshots as the rest of the app
 * (src/data/skyvera-snapshot.json and dm-tracker-snapshot.json), so it works
 * on Vercel and tracks whatever quarter `npm run refresh-data` last loaded.
 */
import { join } from 'path'
import { readFileSync } from 'fs'

interface SnapshotFinancials {
  totalRevenue: number
  totalRR: number
  totalNRR: number
  rrPriorPlan: number
  grossMargin: number
  netMargin: number
  marginTarget: number
  netProfit: number
  ebitda: number
  customerCount?: number
}

interface SnapshotCustomer {
  customer_name: string
  rr: number
  nrr: number
  total: number
}

interface Snapshot {
  fiscalQuarter?: string
  financials: Record<string, SnapshotFinancials>
  customers: Record<string, SnapshotCustomer[]>
}

interface DMSnapshot {
  consolidated: { dm_pct: number; target: number; ttm_quarters: Array<{ quarter: string; dm_pct: number }> }
  business_units: Array<{ bu: string; dm_pct: number; ttm_quarters: Array<{ quarter: string; dm_pct: number }> }>
}

const CONSOLIDATED_KEY = 'Skyvera'

function readSnapshot<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', file), 'utf-8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`[nlq] Failed to read ${file}:`, error)
    }
    return null
  }
}

const usd = (n: number) => Math.round(n)
const pct = (n: number) => Math.round(n * 10) / 10

function summarizeFinancials(f: SnapshotFinancials) {
  return {
    revenue: usd(f.totalRevenue),
    recurringRevenue: usd(f.totalRR),
    nonRecurringRevenue: usd(f.totalNRR),
    recurringRevenuePriorPlan: usd(f.rrPriorPlan),
    grossMarginPct: pct(f.grossMargin),
    netMarginPct: pct(f.netMargin),
    netMarginTargetPct: pct(f.marginTarget),
    netProfit: usd(f.netProfit),
    ebitda: usd(f.ebitda),
  }
}

let cached: Record<string, unknown> | null | undefined

/** The query data context, or null when the budget snapshot is unavailable. */
export function getQueryDataContext(): Record<string, unknown> | null {
  if (cached !== undefined) return cached

  const snapshot = readSnapshot<Snapshot>('skyvera-snapshot.json')
  if (!snapshot) return (cached = null)
  const dm = readSnapshot<DMSnapshot>('dm-tracker-snapshot.json')

  const { [CONSOLIDATED_KEY]: consolidated, ...byBU } = snapshot.financials

  const customers = Object.entries(snapshot.customers)
    .flatMap(([bu, list]) => list.map((c) => ({ ...c, bu })))
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ name: c.customer_name, bu: c.bu, annualRR: usd(c.rr), annualNRR: usd(c.nrr) }))

  cached = {
    currentQuarter: snapshot.fiscalQuarter ?? null,
    units:
      'Business unit and company figures are for the current quarter, in USD. ' +
      'Customer annualRR/annualNRR are already annual: do not multiply them by 4. ' +
      'ARR for a business unit = quarterly recurringRevenue x 4.',
    company: consolidated ? summarizeFinancials(consolidated) : null,
    businessUnits: Object.fromEntries(
      Object.entries(byBU).map(([bu, f]) => [bu, { ...summarizeFinancials(f), customers: f.customerCount }])
    ),
    retention: dm
      ? {
          definitions:
            'dmVsPriorPlanPct = current quarter plan RR / prior plan RR. ' +
            'yearOverYearPct = a quarter\'s RR / the same quarter a year earlier.',
          targetPct: dm.consolidated.target,
          company: {
            dmVsPriorPlanPct: pct(dm.consolidated.dm_pct),
            yearOverYearPct: dm.consolidated.ttm_quarters.map((q) => ({ quarter: q.quarter, pct: pct(q.dm_pct) })),
          },
          businessUnits: Object.fromEntries(
            dm.business_units.map((b) => [
              b.bu,
              {
                dmVsPriorPlanPct: pct(b.dm_pct),
                yearOverYearPct: b.ttm_quarters.map((q) => ({ quarter: q.quarter, pct: pct(q.dm_pct) })),
              },
            ])
          ),
        }
      : null,
    customers,
  }
  return cached
}
