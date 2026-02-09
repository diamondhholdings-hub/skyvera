/**
 * Server-side data fetching for account plans
 * Loads stakeholders, strategy, actions, competitors, intelligence, and news for any account
 * Gracefully handles missing data with empty arrays (no crashes)
 */

import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { ok, err, type Result } from '@/lib/types/result'
import type {
  Stakeholder,
  StrategyData,
  ActionItem,
  Competitor,
  IntelligenceReport,
} from '@/lib/types/account-plan'
import type { NewsArticle } from '@/lib/types/news'
import {
  StakeholderSchema,
  StrategyDataSchema,
  ActionItemSchema,
  CompetitorSchema,
} from '@/lib/types/account-plan'

/**
 * Convert customer name to file-safe slug for JSON lookups
 * Rules: lowercase, spaces to hyphens, remove commas/periods/parens, & to and
 *
 * Examples:
 *   "British Telecommunications plc" -> "british-telecommunications-plc"
 *   "AT&T SERVICES, INC." -> "att-services-inc"
 *   "Liquid Telecom" -> "liquid-telecom"
 */
export function slugifyCustomerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[,.()\[\]]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Find intelligence report file for customer
 * Intelligence files use underscores and abbreviated names (e.g., British_Telecommunications.md)
 * Tries multiple patterns to find the best match
 */
async function findIntelligenceFile(customerName: string): Promise<string | null> {
  const reportsDir = path.join(process.cwd(), 'data/intelligence/reports')

  try {
    const files = await readdir(reportsDir)

    // Try exact name variations
    const patterns = [
      // Underscore version with exact name
      customerName.replace(/\s+/g, '_').replace(/[,.()\[\]]/g, ''),
      // Abbreviated versions (remove suffixes like plc, Inc, Ltd, Limited)
      customerName
        .replace(/\s+(plc|inc\.?|ltd\.?|limited|llc|corporation|corp\.?|services)$/i, '')
        .replace(/\s+/g, '_')
        .replace(/[,.()\[\]]/g, ''),
      // Slug with underscores
      slugifyCustomerName(customerName).replace(/-/g, '_'),
    ]

    // Try to find a matching file
    for (const pattern of patterns) {
      for (const file of files) {
        if (file.toLowerCase() === `${pattern.toLowerCase()}.md`) {
          return path.join(reportsDir, file)
        }
      }
    }

    // Fuzzy match: find file that contains key parts of customer name
    const nameWords = customerName.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    for (const file of files) {
      const fileLower = file.toLowerCase()
      const matchCount = nameWords.filter((word) => fileLower.includes(word)).length
      if (matchCount >= Math.min(2, nameWords.length)) {
        return path.join(reportsDir, file)
      }
    }

    return null
  } catch (error) {
    console.error(`[findIntelligenceFile] Error reading reports directory:`, error)
    return null
  }
}

/**
 * Get stakeholders for account (org hierarchy with RACI roles)
 * Returns empty array if file not found (graceful degradation)
 */
export async function getStakeholders(
  customerName: string
): Promise<Result<Stakeholder[], Error>> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/stakeholders/${slug}.json`)

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Validate with Zod
    const stakeholders = z.array(StakeholderSchema).parse(data)

    return ok(stakeholders)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found - return empty array, not error
      return ok([])
    }
    console.error(`[getStakeholders] Error loading stakeholders for ${customerName}:`, error)
    return err(
      new Error(
        `Failed to load stakeholders: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get strategy data (pain points + opportunities)
 * Returns empty arrays if file not found (graceful degradation)
 */
export async function getStrategyData(
  customerName: string
): Promise<Result<StrategyData, Error>> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/strategy/${slug}.json`)

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Validate with Zod
    const strategyData = StrategyDataSchema.parse(data)

    return ok(strategyData)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found - return empty structure, not error
      return ok({ painPoints: [], opportunities: [] })
    }
    console.error(`[getStrategyData] Error loading strategy data for ${customerName}:`, error)
    return err(
      new Error(
        `Failed to load strategy data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get action items for account
 * Returns empty array if file not found (graceful degradation)
 */
export async function getActionItems(
  customerName: string
): Promise<Result<ActionItem[], Error>> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/actions/${slug}.json`)

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Validate with Zod
    const actions = z.array(ActionItemSchema).parse(data)

    return ok(actions)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found - return empty array, not error
      return ok([])
    }
    console.error(`[getActionItems] Error loading actions for ${customerName}:`, error)
    return err(
      new Error(
        `Failed to load actions: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get competitors for account
 * Returns empty array if file not found (graceful degradation)
 */
export async function getCompetitors(
  customerName: string
): Promise<Result<Competitor[], Error>> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/competitors/${slug}.json`)

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Validate with Zod
    const competitors = z.array(CompetitorSchema).parse(data)

    return ok(competitors)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found - return empty array, not error
      return ok([])
    }
    console.error(`[getCompetitors] Error loading competitors for ${customerName}:`, error)
    return err(
      new Error(
        `Failed to load competitors: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get intelligence report for account (markdown file)
 * Returns raw markdown content and attempts to extract structured data
 * Returns empty string if file not found (graceful degradation)
 */
export async function getIntelligenceReport(
  customerName: string
): Promise<Result<{ raw: string; structured?: IntelligenceReport }, Error>> {
  try {
    const filePath = await findIntelligenceFile(customerName)

    if (!filePath) {
      // No intelligence report found - return empty, not error
      return ok({ raw: '' })
    }

    const content = await readFile(filePath, 'utf-8')

    // For now, return raw markdown
    // Future: parse sections into structured IntelligenceReport
    // Sections to parse: ## OPPORTUNITIES, ## RISKS, ## ACTION PLAN
    return ok({ raw: content })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found - return empty, not error
      return ok({ raw: '' })
    }
    console.error(`[getIntelligenceReport] Error loading intelligence for ${customerName}:`, error)
    return err(
      new Error(
        `Failed to load intelligence report: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get customer news articles
 * News files use format: {Name}_news.json (with underscores and special chars)
 * Returns empty array if file not found (graceful degradation)
 */
export async function getCustomerNews(
  customerName: string
): Promise<Result<{ articles: NewsArticle[] }, Error>> {
  // News files use customer name with underscores, preserving special chars
  const newsName = customerName.replace(/\s+/g, '_')
  const filePath = path.join(process.cwd(), `data/news/${newsName}_news.json`)

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Map news JSON format to NewsArticle schema
    // Source format: {customer_name, last_updated, article_count, articles[{title, url, source, published, summary, relevance_score}]}
    const articles: NewsArticle[] = (data.articles || []).map((article: any) => ({
      title: article.title,
      summary: article.summary,
      publishedAt: article.published, // Map 'published' to 'publishedAt'
      source: article.source,
      url: article.url,
      relevanceScore: article.relevance_score, // Map 'relevance_score' to 'relevanceScore'
    }))

    return ok({ articles })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found - return empty array, not error
      return ok({ articles: [] })
    }
    console.error(`[getCustomerNews] Error loading news for ${customerName}:`, error)
    return err(
      new Error(
        `Failed to load news: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    )
  }
}

/**
 * Get all account plan data for customer (aggregate function)
 * Calls all data functions in parallel and returns combined result
 */
export async function getAccountPlanData(customerName: string) {
  const [
    stakeholdersResult,
    strategyResult,
    actionsResult,
    competitorsResult,
    intelligenceResult,
    newsResult,
  ] = await Promise.all([
    getStakeholders(customerName),
    getStrategyData(customerName),
    getActionItems(customerName),
    getCompetitors(customerName),
    getIntelligenceReport(customerName),
    getCustomerNews(customerName),
  ])

  // Collect errors (only return errors for actual failures, not missing files)
  const errors: string[] = []
  if (!stakeholdersResult.success) errors.push(`Stakeholders: ${stakeholdersResult.error.message}`)
  if (!strategyResult.success) errors.push(`Strategy: ${strategyResult.error.message}`)
  if (!actionsResult.success) errors.push(`Actions: ${actionsResult.error.message}`)
  if (!competitorsResult.success) errors.push(`Competitors: ${competitorsResult.error.message}`)
  if (!intelligenceResult.success)
    errors.push(`Intelligence: ${intelligenceResult.error.message}`)
  if (!newsResult.success) errors.push(`News: ${newsResult.error.message}`)

  if (errors.length > 0) {
    return err(new Error(`Failed to load account plan data: ${errors.join('; ')}`))
  }

  return ok({
    stakeholders: stakeholdersResult.success ? stakeholdersResult.value : [],
    strategy: strategyResult.success
      ? strategyResult.value
      : { painPoints: [], opportunities: [] },
    actions: actionsResult.success ? actionsResult.value : [],
    competitors: competitorsResult.success ? competitorsResult.value : [],
    intelligence: intelligenceResult.success ? intelligenceResult.value : { raw: '' },
    news: newsResult.success ? newsResult.value : { articles: [] },
  })
}

// Import z for validation
import { z } from 'zod'
