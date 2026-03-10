/**
 * Bulk enrichment script — enriches all Skyvera accounts via the RapidAPI pipeline.
 *
 * Usage:
 *   npx tsx scripts/enrich-accounts.ts
 *   npx tsx scripts/enrich-accounts.ts --limit 10
 *   npx tsx scripts/enrich-accounts.ts --bu Cloudsense
 *   npx tsx scripts/enrich-accounts.ts --limit 5 --bu Kandy
 *
 * Options:
 *   --limit N    Only enrich the first N accounts (default: all)
 *   --bu NAME    Only enrich accounts in the given business unit (Cloudsense, Kandy, STL)
 */

import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { readFileSync } from 'fs'
import path from 'path'
import { enrichAllAccounts } from '../src/lib/data/server/enrichment-pipeline'

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

function parseArgs(): { limit?: number; bu?: string } {
  const args = process.argv.slice(2)
  const result: { limit?: number; bu?: string } = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      const n = parseInt(args[i + 1], 10)
      if (!isNaN(n) && n > 0) {
        result.limit = n
      }
      i++
    } else if (args[i] === '--bu' && args[i + 1]) {
      result.bu = args[i + 1]
      i++
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Load customer names from skyvera-snapshot.json
// ---------------------------------------------------------------------------

interface SnapshotCustomer {
  customer_name?: string
  name?: string
  customerName?: string
}

interface SkyveraSnapshot {
  customers?: Record<string, SnapshotCustomer[]>
}

function loadCustomerNames(bu?: string): string[] {
  const snapshotPath = path.join(process.cwd(), 'src', 'data', 'skyvera-snapshot.json')

  let snapshot: SkyveraSnapshot

  try {
    const raw = readFileSync(snapshotPath, 'utf-8')
    snapshot = JSON.parse(raw) as SkyveraSnapshot
  } catch (error) {
    console.error('[enrich-accounts] Failed to read skyvera-snapshot.json:', error)
    process.exit(1)
  }

  const customersMap = snapshot.customers ?? {}
  const allNames: string[] = []

  for (const [buName, customers] of Object.entries(customersMap)) {
    // Filter by BU if --bu flag was provided (case-insensitive)
    if (bu && buName.toLowerCase() !== bu.toLowerCase()) {
      continue
    }

    if (!Array.isArray(customers)) continue

    for (const customer of customers) {
      const name = customer.customer_name ?? customer.name ?? customer.customerName
      if (name && name.trim()) {
        allNames.push(name.trim())
      }
    }
  }

  // Deduplicate (a customer may appear in multiple BUs)
  return [...new Set(allNames)]
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { limit, bu } = parseArgs()

  console.log('[enrich-accounts] Starting bulk enrichment...')
  if (bu) console.log(`[enrich-accounts] Filtering to BU: ${bu}`)
  if (limit) console.log(`[enrich-accounts] Limiting to first ${limit} accounts`)

  let customerNames = loadCustomerNames(bu)

  if (customerNames.length === 0) {
    console.warn('[enrich-accounts] No customers found. Check snapshot or --bu value.')
    process.exit(0)
  }

  console.log(`[enrich-accounts] Found ${customerNames.length} unique customers`)

  if (limit) {
    customerNames = customerNames.slice(0, limit)
    console.log(`[enrich-accounts] Limiting to ${customerNames.length} accounts`)
  }

  const start = Date.now()
  const { succeeded, failed, skipped } = await enrichAllAccounts(customerNames)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log(`
[enrich-accounts] Enrichment complete in ${elapsed}s
  Succeeded : ${succeeded}
  Failed    : ${failed}
  Skipped   : ${skipped}
  Total     : ${customerNames.length}
`)

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('[enrich-accounts] Unhandled error:', error)
  process.exit(1)
})
