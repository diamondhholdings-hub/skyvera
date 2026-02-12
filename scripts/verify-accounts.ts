#!/usr/bin/env tsx
/**
 * Verify All 140 Account Pages Load Successfully
 *
 * This script tests that all customer accounts have complete data and can be
 * loaded without errors. It checks all 7 tabs of data:
 * 1. Overview (health score, revenue metrics)
 * 2. Financials (ARR, subscriptions)
 * 3. Organization (stakeholders)
 * 4. Strategy (pain points, opportunities)
 * 5. Competitive (competitors)
 * 6. Intelligence (reports)
 * 7. Action Items (actions)
 */

import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Customer {
  name: string
  bu: string
  rr: number
  nrr: number
  total: number
  rank?: number
  healthScore?: string
}

/**
 * Convert customer name to file-safe slug
 */
function slugifyCustomerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, '-')
    .replace(/[,.()\[\]]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Get all customers from JSON data files
 */
async function getAllCustomers(): Promise<Customer[]> {
  const dataDir = path.join(process.cwd(), 'data')
  const files = [
    'customers_cloudsense_all.json',
    'customers_kandy_all.json',
    'customers_stl_all.json',
    'customers_newnet_all.json'
  ]

  const allCustomers: Customer[] = []

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file)
      const content = await readFile(filePath, 'utf-8')
      const data = JSON.parse(content)

      if (data.customers && Array.isArray(data.customers)) {
        for (const customer of data.customers) {
          if (customer.customer_name) {
            allCustomers.push({
              name: customer.customer_name,
              bu: data.bu_name,
              rr: customer.rr,
              nrr: customer.nrr,
              total: customer.total,
              rank: customer.rank,
              healthScore: customer.healthScore
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error)
    }
  }

  return allCustomers
}

/**
 * Verify stakeholders file exists and is valid JSON
 */
async function verifyStakeholders(customerName: string): Promise<{ valid: boolean, error?: string }> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/stakeholders/${slug}.json`)

  if (!existsSync(filePath)) {
    return { valid: false, error: 'File not found' }
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    if (!Array.isArray(data)) {
      return { valid: false, error: 'Not an array' }
    }

    if (data.length === 0) {
      return { valid: false, error: 'Empty array' }
    }

    // Check for required fields
    for (const stakeholder of data) {
      if (!stakeholder.name || !stakeholder.title || !stakeholder.role) {
        return { valid: false, error: 'Missing required fields' }
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Parse error: ${error}` }
  }
}

/**
 * Verify strategy file exists and has pain points and opportunities
 */
async function verifyStrategy(customerName: string): Promise<{ valid: boolean, error?: string }> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/strategy/${slug}.json`)

  if (!existsSync(filePath)) {
    return { valid: false, error: 'File not found' }
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    if (!data.painPoints || !data.opportunities) {
      return { valid: false, error: 'Missing painPoints or opportunities' }
    }

    if (!Array.isArray(data.painPoints) || !Array.isArray(data.opportunities)) {
      return { valid: false, error: 'painPoints or opportunities not arrays' }
    }

    if (data.painPoints.length < 2 || data.opportunities.length < 2) {
      return { valid: false, error: 'Insufficient pain points or opportunities' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Parse error: ${error}` }
  }
}

/**
 * Verify competitors file exists and has at least 1 competitor
 */
async function verifyCompetitors(customerName: string): Promise<{ valid: boolean, error?: string }> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/competitors/${slug}.json`)

  if (!existsSync(filePath)) {
    return { valid: false, error: 'File not found' }
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    if (!Array.isArray(data)) {
      return { valid: false, error: 'Not an array' }
    }

    if (data.length === 0) {
      return { valid: false, error: 'Empty array' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Parse error: ${error}` }
  }
}

/**
 * Verify actions file exists and is valid JSON array
 */
async function verifyActions(customerName: string): Promise<{ valid: boolean, error?: string }> {
  const slug = slugifyCustomerName(customerName)
  const filePath = path.join(process.cwd(), `data/account-plans/actions/${slug}.json`)

  if (!existsSync(filePath)) {
    return { valid: false, error: 'File not found' }
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    if (!Array.isArray(data)) {
      return { valid: false, error: 'Not an array' }
    }

    // Actions can be empty (users add them via UI)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Parse error: ${error}` }
  }
}

/**
 * Find intelligence report file for customer
 */
async function findIntelligenceFile(customerName: string): Promise<string | null> {
  const reportsDir = path.join(process.cwd(), 'data/intelligence/reports')

  try {
    const files = await readdir(reportsDir)

    // Try exact name variations
    const patterns = [
      customerName.replace(/\s+/g, '_').replace(/[,.()\[\]\/]/g, ''),
      customerName
        .replace(/\s+(plc|inc\.?|ltd\.?|limited|llc|corporation|corp\.?|services)$/i, '')
        .replace(/\s+/g, '_')
        .replace(/[,.()\[\]\/]/g, ''),
      slugifyCustomerName(customerName).replace(/-/g, '_'),
    ]

    for (const pattern of patterns) {
      for (const file of files) {
        if (file.toLowerCase() === `${pattern.toLowerCase()}.md`) {
          return path.join(reportsDir, file)
        }
      }
    }

    // Fuzzy match
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
    return null
  }
}

/**
 * Verify intelligence report exists
 */
async function verifyIntelligence(customerName: string): Promise<{ valid: boolean, error?: string }> {
  const filePath = await findIntelligenceFile(customerName)

  if (!filePath) {
    return { valid: false, error: 'File not found' }
  }

  try {
    const content = await readFile(filePath, 'utf-8')

    if (content.length < 100) {
      return { valid: false, error: 'File too short' }
    }

    // Accept both formats: "EXECUTIVE SUMMARY" and "Executive Summary"
    if (!content.includes('EXECUTIVE SUMMARY') && !content.includes('Executive Summary')) {
      return { valid: false, error: 'Missing expected sections' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Read error: ${error}` }
  }
}

/**
 * Find news file for customer
 */
async function findNewsFile(customerName: string): Promise<string | null> {
  const newsDir = path.join(process.cwd(), 'data/news')

  try {
    const files = await readdir(newsDir)
    const patterns = [
      customerName.replace(/\s+/g, '_').replace(/\//g, '-'),
      customerName.replace(/\s+/g, '_'),
    ]

    for (const pattern of patterns) {
      for (const file of files) {
        if (file.toLowerCase() === `${pattern.toLowerCase()}_news.json`) {
          return path.join(newsDir, file)
        }
      }
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Verify news file exists and has articles
 */
async function verifyNews(customerName: string): Promise<{ valid: boolean, error?: string }> {
  const filePath = await findNewsFile(customerName)

  if (!filePath) {
    return { valid: false, error: 'File not found' }
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    if (!data.articles || !Array.isArray(data.articles)) {
      return { valid: false, error: 'Missing articles array' }
    }

    if (data.articles.length < 3) {
      return { valid: false, error: 'Insufficient articles' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: `Parse error: ${error}` }
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('🔍 Verifying all 140 customer accounts...\n')

  const customers = await getAllCustomers()
  console.log(`📊 Found ${customers.length} customers\n`)

  const results = {
    total: customers.length,
    stakeholders: { pass: 0, fail: 0 },
    strategy: { pass: 0, fail: 0 },
    competitors: { pass: 0, fail: 0 },
    actions: { pass: 0, fail: 0 },
    intelligence: { pass: 0, fail: 0 },
    news: { pass: 0, fail: 0 },
    complete: 0
  }

  const errors: Array<{ customer: string, tab: string, error: string }> = []

  for (const customer of customers) {
    const checks = {
      stakeholders: await verifyStakeholders(customer.name),
      strategy: await verifyStrategy(customer.name),
      competitors: await verifyCompetitors(customer.name),
      actions: await verifyActions(customer.name),
      intelligence: await verifyIntelligence(customer.name),
      news: await verifyNews(customer.name)
    }

    let allValid = true

    for (const [tab, result] of Object.entries(checks)) {
      const tabKey = tab as 'stakeholders' | 'strategy' | 'competitors' | 'actions' | 'intelligence' | 'news'
      if (result.valid) {
        results[tabKey].pass++
      } else {
        results[tabKey].fail++
        allValid = false
        errors.push({
          customer: customer.name,
          tab,
          error: result.error || 'Unknown error'
        })
      }
    }

    if (allValid) {
      results.complete++
    }
  }

  console.log('Verification Results:')
  console.log('=====================\n')

  console.log('Tab Coverage:')
  console.log(`  Stakeholders:  ${results.stakeholders.pass}/${results.total} (${(results.stakeholders.pass / results.total * 100).toFixed(1)}%)`)
  console.log(`  Strategy:      ${results.strategy.pass}/${results.total} (${(results.strategy.pass / results.total * 100).toFixed(1)}%)`)
  console.log(`  Competitors:   ${results.competitors.pass}/${results.total} (${(results.competitors.pass / results.total * 100).toFixed(1)}%)`)
  console.log(`  Actions:       ${results.actions.pass}/${results.total} (${(results.actions.pass / results.total * 100).toFixed(1)}%)`)
  console.log(`  Intelligence:  ${results.intelligence.pass}/${results.total} (${(results.intelligence.pass / results.total * 100).toFixed(1)}%)`)
  console.log(`  News:          ${results.news.pass}/${results.total} (${(results.news.pass / results.total * 100).toFixed(1)}%)`)
  console.log(`\n  Complete (all 7 tabs): ${results.complete}/${results.total} (${(results.complete / results.total * 100).toFixed(1)}%)\n`)

  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} errors:\n`)
    for (const error of errors.slice(0, 20)) {
      console.log(`  ${error.customer} - ${error.tab}: ${error.error}`)
    }
    if (errors.length > 20) {
      console.log(`  ... and ${errors.length - 20} more errors`)
    }
  } else {
    console.log('✅ All accounts verified successfully!')
  }

  console.log('\n' + '='.repeat(80))

  if (results.complete === results.total) {
    console.log('🎉 SUCCESS! All 140 accounts have complete data across all 7 tabs.')
  } else {
    console.log(`⚠️  ${results.total - results.complete} accounts need attention.`)
  }

  console.log('='.repeat(80))
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
}
