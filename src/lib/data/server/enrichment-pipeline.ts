/**
 * Enrichment pipeline — fetches all RapidAPI data for a single account
 * Calls all 5 adapters in parallel, writes result to data/enrichment/{slug}.json
 * Falls back gracefully if individual adapters fail
 */

import { writeFile, readFile, mkdir } from 'fs/promises'
import path from 'path'
import { ok, err, type Result } from '@/lib/types/result'
import { getConnectorFactory } from '@/lib/data/registry/connector-factory'
import { slugifyCustomerName } from '@/lib/data/server/account-plan-data'
import type { AccountEnrichment } from '@/lib/types/enrichment'
import type { CompanyProfile } from '@/lib/data/adapters/rapidapi/enrichment'
import type { SentimentNewsArticle } from '@/lib/data/adapters/rapidapi/news-sentiment'
import type { PublicCompanyFinancials } from '@/lib/data/adapters/rapidapi/financial-intel'
import type { HiringSignal } from '@/lib/data/adapters/rapidapi/hiring-signals'
import type { RiskCompetitiveProfile } from '@/lib/data/adapters/rapidapi/risk-competitive'
import type { CorporateRegistryData } from '@/lib/data/adapters/external/opencorporates'

const ENRICHMENT_DIR = path.join(process.cwd(), 'data', 'enrichment')

/**
 * Enrich a single account by running all 5 RapidAPI adapters in parallel.
 *
 * Uses `Promise.allSettled` (not `Promise.all`) so that one failing adapter never
 * blocks the others. Each section in the returned `AccountEnrichment` carries its
 * own status: `'ok'` (data present), `'skipped'` (adapter returned empty results),
 * or `'error'` (adapter threw or returned a failure Result).
 *
 * The enrichment object is written to `data/enrichment/{slug}.json` as a persistent
 * cache. This file is read by `getEnrichmentCache` on subsequent page loads without
 * hitting RapidAPI again.
 *
 * @param customerName  Customer name as it appears in the database (will be slugified)
 * @returns             Result containing the full AccountEnrichment, or an error if
 *                      the pipeline itself fails (individual adapter errors are non-fatal)
 */
export async function enrichAccount(
  customerName: string
): Promise<Result<AccountEnrichment, Error>> {
  const slug = slugifyCustomerName(customerName)

  try {
    const factory = await getConnectorFactory()
    const baseQuery = { filters: { customerName } }

    // Run all 6 adapters in parallel
    const [enrichmentResult, financialsResult, hiringResult, riskResult, newsResult, corporateResult] =
      await Promise.allSettled([
        factory.getData('rapidapi-enrichment', { ...baseQuery, type: 'customers' }),
        factory.getData('rapidapi-financial-intel', { ...baseQuery, type: 'financials' }),
        factory.getData('rapidapi-hiring-signals', { ...baseQuery, type: 'customers' }),
        factory.getData('rapidapi-risk-competitive', { ...baseQuery, type: 'customers' }),
        factory.getData('rapidapi-news-sentiment', { ...baseQuery, type: 'news' }),
        factory.getData('opencorporates', { ...baseQuery, type: 'customers' }),
      ])

    // Extract data and determine per-section status
    let companyProfile: CompanyProfile | undefined
    let companyStatus: AccountEnrichment['enrichmentStatus']['company'] = 'error'

    if (enrichmentResult.status === 'fulfilled' && enrichmentResult.value.success) {
      const items = enrichmentResult.value.value.data
      if (Array.isArray(items) && items.length > 0) {
        companyProfile = items[0] as CompanyProfile
        companyStatus = 'ok'
      } else {
        companyStatus = 'skipped'
      }
    } else {
      const reason =
        enrichmentResult.status === 'rejected'
          ? enrichmentResult.reason
          : !enrichmentResult.value.success
            ? enrichmentResult.value.error?.message
            : 'unknown'
      console.warn(`[enrichAccount] company enrichment failed for "${customerName}":`, reason)
      companyStatus = 'error'
    }

    let financials: PublicCompanyFinancials | undefined
    let financialsStatus: AccountEnrichment['enrichmentStatus']['financials'] = 'error'

    if (financialsResult.status === 'fulfilled' && financialsResult.value.success) {
      const items = financialsResult.value.value.data
      if (Array.isArray(items) && items.length > 0) {
        financials = items[0] as PublicCompanyFinancials
        financialsStatus = 'ok'
      } else {
        financialsStatus = 'skipped'
      }
    } else {
      const reason =
        financialsResult.status === 'rejected'
          ? financialsResult.reason
          : !financialsResult.value.success
            ? financialsResult.value.error?.message
            : 'unknown'
      console.warn(`[enrichAccount] financials failed for "${customerName}":`, reason)
      financialsStatus = 'error'
    }

    let hiringSignals: HiringSignal | undefined
    let hiringStatus: AccountEnrichment['enrichmentStatus']['hiring'] = 'error'

    if (hiringResult.status === 'fulfilled' && hiringResult.value.success) {
      const items = hiringResult.value.value.data
      if (Array.isArray(items) && items.length > 0) {
        hiringSignals = items[0] as HiringSignal
        hiringStatus = 'ok'
      } else {
        hiringStatus = 'skipped'
      }
    } else {
      const reason =
        hiringResult.status === 'rejected'
          ? hiringResult.reason
          : !hiringResult.value.success
            ? hiringResult.value.error?.message
            : 'unknown'
      console.warn(`[enrichAccount] hiring signals failed for "${customerName}":`, reason)
      hiringStatus = 'error'
    }

    let riskCompetitive: RiskCompetitiveProfile | undefined
    let riskStatus: AccountEnrichment['enrichmentStatus']['risk'] = 'error'

    if (riskResult.status === 'fulfilled' && riskResult.value.success) {
      const items = riskResult.value.value.data
      if (Array.isArray(items) && items.length > 0) {
        riskCompetitive = items[0] as RiskCompetitiveProfile
        riskStatus = 'ok'
      } else {
        riskStatus = 'skipped'
      }
    } else {
      const reason =
        riskResult.status === 'rejected'
          ? riskResult.reason
          : !riskResult.value.success
            ? riskResult.value.error?.message
            : 'unknown'
      console.warn(`[enrichAccount] risk/competitive failed for "${customerName}":`, reason)
      riskStatus = 'error'
    }

    let recentNews: SentimentNewsArticle[] | undefined
    let newsStatus: AccountEnrichment['enrichmentStatus']['news'] = 'error'

    if (newsResult.status === 'fulfilled' && newsResult.value.success) {
      const items = newsResult.value.value.data
      if (Array.isArray(items) && items.length > 0) {
        recentNews = items as SentimentNewsArticle[]
        newsStatus = 'ok'
      } else {
        newsStatus = 'skipped'
      }
    } else {
      const reason =
        newsResult.status === 'rejected'
          ? newsResult.reason
          : !newsResult.value.success
            ? newsResult.value.error?.message
            : 'unknown'
      console.warn(`[enrichAccount] news sentiment failed for "${customerName}":`, reason)
      newsStatus = 'error'
    }

    let corporateRegistry: CorporateRegistryData | undefined
    let corporateStatus: AccountEnrichment['enrichmentStatus']['corporate'] = 'error'

    if (corporateResult.status === 'fulfilled' && corporateResult.value.success) {
      const items = corporateResult.value.value.data
      if (Array.isArray(items) && items.length > 0) {
        corporateRegistry = items[0] as CorporateRegistryData
        corporateStatus = 'ok'
      } else {
        corporateStatus = 'skipped'
      }
    } else {
      const reason =
        corporateResult.status === 'rejected'
          ? corporateResult.reason
          : !corporateResult.value.success
            ? corporateResult.value.error?.message
            : 'unknown'
      console.warn(`[enrichAccount] corporate registry failed for "${customerName}":`, reason)
      corporateStatus = 'error'
    }

    const enrichment: AccountEnrichment = {
      customerName,
      slug,
      companyProfile,
      financials,
      hiringSignals,
      riskCompetitive,
      recentNews,
      corporateRegistry,
      enrichedAt: new Date().toISOString(),
      enrichmentStatus: {
        company: companyStatus,
        financials: financialsStatus,
        hiring: hiringStatus,
        risk: riskStatus,
        news: newsStatus,
        corporate: corporateStatus,
      },
    }

    // Write to cache file
    await mkdir(ENRICHMENT_DIR, { recursive: true })
    const filePath = path.join(ENRICHMENT_DIR, `${slug}.json`)
    await writeFile(filePath, JSON.stringify(enrichment, null, 2), 'utf-8')

    console.log(
      `[enrichAccount] Wrote enrichment for "${customerName}" to ${filePath} ` +
        `(company=${companyStatus}, financials=${financialsStatus}, hiring=${hiringStatus}, ` +
        `risk=${riskStatus}, news=${newsStatus}, corporate=${corporateStatus})`
    )

    return ok(enrichment)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[enrichAccount] Fatal error enriching "${customerName}":`, error)
    return err(new Error(`enrichAccount failed for "${customerName}": ${msg}`))
  }
}

/**
 * Read cached enrichment data for a customer.
 * Returns null if the enrichment file does not exist.
 */
export async function getEnrichmentCache(customerName: string): Promise<AccountEnrichment | null> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(ENRICHMENT_DIR, `${slug}.json`)

  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as AccountEnrichment
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    console.error(`[getEnrichmentCache] Error reading enrichment for "${customerName}":`, error)
    return null
  }
}

/**
 * Sequentially enrich a list of customers, respecting RapidAPI rate limits.
 *
 * Processes accounts one at a time (not in parallel) with a 500 ms pause between
 * each call to stay within RapidAPI's per-second request limits. Each account calls
 * all 5 adapters internally via `enrichAccount`, which itself uses `Promise.allSettled`,
 * so individual adapter failures are counted as non-fatal (increments `succeeded`
 * if the pipeline completes, regardless of per-section adapter status).
 *
 * Empty/whitespace-only names are skipped and counted separately. Progress is logged
 * to the console so long-running bulk enrichments can be monitored.
 *
 * @param customerNames  List of customer names to enrich (140 max for full portfolio)
 * @returns              Counts of succeeded, failed, and skipped enrichments
 */
export async function enrichAllAccounts(
  customerNames: string[]
): Promise<{ succeeded: number; failed: number; skipped: number }> {
  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i]

    if (!name || !name.trim()) {
      skipped++
      continue
    }

    console.log(`[enrichAllAccounts] Enriching ${i + 1}/${customerNames.length}: "${name}"`)

    const result = await enrichAccount(name)

    if (result.success) {
      succeeded++
    } else {
      failed++
      console.error(`[enrichAllAccounts] Failed: "${name}":`, result.error)
    }

    // Rate-limit guard: 500ms between calls (skip delay after the last item)
    if (i < customerNames.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(
    `[enrichAllAccounts] Done — succeeded: ${succeeded}, failed: ${failed}, skipped: ${skipped}`
  )

  return { succeeded, failed, skipped }
}
