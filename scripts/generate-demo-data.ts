#!/usr/bin/env tsx
/**
 * Generate baseline demo data for all 140 customer accounts
 *
 * Creates stakeholder, strategy, competitor, and action files for any accounts missing data
 * Preserves hero account rich data by skipping files that already exist
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Convert customer name to file-safe slug for JSON lookups
 * Matches logic from src/lib/data/server/account-plan-data.ts
 */
function slugifyCustomerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, '-') // Replace slashes with hyphens
    .replace(/[,.()\[\]]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract domain from customer name for email generation
 * Examples:
 *   "British Telecommunications plc" -> "bt.com"
 *   "AT&T Services, Inc." -> "att.com"
 *   "Liquid Telecom" -> "liquidtelecom.com"
 */
function extractDomain(name: string): string {
  // Remove common suffixes
  const cleaned = name
    .replace(/\s+(plc|inc\.?|ltd\.?|limited|llc|corporation|corp\.?|services)$/i, '')
    .trim()

  // Extract first word or abbreviation
  const words = cleaned.split(/\s+/)
  if (words.length === 1) {
    return `${words[0].toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
  }

  // For multi-word names, use acronym or first word
  const firstWord = words[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${firstWord}.com`
}

/**
 * Generate realistic stakeholder data for customer
 */
function generateStakeholders(customerName: string): any[] {
  const domain = extractDomain(customerName)
  const slug = slugifyCustomerName(customerName)

  return [
    {
      id: `${slug}-001`,
      name: "Chief Technology Officer",
      title: "CTO",
      role: "decision-maker",
      raciRole: "accountable",
      email: `cto@${domain}`,
      reportsTo: null,
      tenure: "3 years",
      interests: ["digital transformation", "platform modernization", "cost optimization"],
      relationshipStrength: "moderate",
      lastInteraction: "2025-12-10",
      notes: "Key decision maker for technology strategy and platform investments."
    },
    {
      id: `${slug}-002`,
      name: "VP of Operations",
      title: "VP Operations",
      role: "champion",
      raciRole: "responsible",
      email: `vp.operations@${domain}`,
      reportsTo: `${slug}-001`,
      tenure: "2 years",
      interests: ["operational efficiency", "automation", "process improvement"],
      relationshipStrength: "strong",
      lastInteraction: "2026-01-15",
      notes: "Strong advocate for our platform. Leads daily operations and platform adoption."
    },
    {
      id: `${slug}-003`,
      name: "Director of IT",
      title: "Director IT",
      role: "influencer",
      raciRole: "consulted",
      email: `director.it@${domain}`,
      reportsTo: `${slug}-001`,
      tenure: "5 years",
      interests: ["technical architecture", "integration", "security"],
      relationshipStrength: "moderate",
      lastInteraction: "2025-11-20",
      notes: "Technical stakeholder. Influences architecture and integration decisions."
    }
  ]
}

/**
 * Generate realistic strategy data (pain points + opportunities)
 */
function generateStrategy(customerName: string): any {
  return {
    painPoints: [
      {
        id: `pp-001`,
        title: "Legacy system modernization needs",
        description: "Current systems lack modern capabilities and integration flexibility. Need to migrate to cloud-native architecture.",
        status: "active",
        severity: "high",
        identifiedDate: "2025-09-15",
        owner: "CTO"
      },
      {
        id: `pp-002`,
        title: "Operational cost pressures",
        description: "Rising operational costs due to manual processes and system inefficiencies. Need automation and optimization.",
        status: "monitoring",
        severity: "medium",
        identifiedDate: "2025-10-01",
        owner: "VP Operations"
      }
    ],
    opportunities: [
      {
        id: `opp-001`,
        title: "Cloud migration initiative",
        description: "Major cloud transformation program planned for 2026. Opportunity to expand platform footprint.",
        status: "identified",
        estimatedValue: 500000,
        probability: 60,
        identifiedDate: "2025-11-01",
        owner: "CTO"
      },
      {
        id: `opp-002`,
        title: "Process automation expansion",
        description: "Looking to automate additional business processes. Our platform can address 3-4 new use cases.",
        status: "exploring",
        estimatedValue: 250000,
        probability: 40,
        identifiedDate: "2025-12-15",
        owner: "VP Operations"
      }
    ]
  }
}

/**
 * Generate realistic competitor data
 */
function generateCompetitors(customerName: string): any[] {
  // Rotate between common telecom/SaaS competitors
  const competitorPool = [
    { name: "Amdocs", products: ["BSS/OSS Platform", "Revenue Management"] },
    { name: "NetCracker", products: ["Digital BSS", "Order Management"] },
    { name: "CSG International", products: ["Revenue Management", "Customer Engagement"] },
    { name: "Ericsson", products: ["BSS Suite", "Charging Systems"] }
  ]

  // Pick 1-2 competitors pseudo-randomly based on customer name length
  const count = customerName.length % 2 === 0 ? 1 : 2
  const competitors = competitorPool.slice(0, count)

  return competitors.map((comp, idx) => ({
    id: `comp-${idx + 1}`,
    name: comp.name,
    type: "our-competitor",
    description: `${comp.name} competes with Skyvera for BSS/OSS platform business.`,
    strengths: [
      "Established market presence",
      "Large customer base"
    ],
    weaknesses: [
      "Legacy technology stack",
      "Higher implementation costs"
    ],
    lastUpdated: "2025-12-01"
  }))
}

/**
 * Generate empty actions array (users create these in Kanban board)
 */
function generateActions(): any[] {
  return []
}

/**
 * Read all customer JSON files and extract customer names
 */
async function getAllCustomers(): Promise<string[]> {
  const dataDir = path.join(process.cwd(), 'data')
  const files = [
    'customers_cloudsense_all.json',
    'customers_kandy_all.json',
    'customers_stl_all.json',
    'customers_newnet_all.json'
  ]

  const allCustomers: string[] = []

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file)
      const content = await readFile(filePath, 'utf-8')
      const data = JSON.parse(content)

      // Extract customer names from customers array
      if (data.customers && Array.isArray(data.customers)) {
        for (const customer of data.customers) {
          if (customer.customer_name) {
            allCustomers.push(customer.customer_name)
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${file}:`, error)
    }
  }

  // Remove duplicates and sort
  return Array.from(new Set(allCustomers)).sort()
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting demo data generation for all 140 accounts...\n')

  const accountPlansDir = path.join(process.cwd(), 'data/account-plans')
  const stakeholdersDir = path.join(accountPlansDir, 'stakeholders')
  const strategyDir = path.join(accountPlansDir, 'strategy')
  const competitorsDir = path.join(accountPlansDir, 'competitors')
  const actionsDir = path.join(accountPlansDir, 'actions')

  // Ensure all directories exist
  await ensureDir(stakeholdersDir)
  await ensureDir(strategyDir)
  await ensureDir(competitorsDir)
  await ensureDir(actionsDir)

  // Get all customers
  const customers = await getAllCustomers()
  console.log(`📊 Found ${customers.length} total customers across all BUs\n`)

  let generated = 0
  let skipped = 0

  for (const customerName of customers) {
    const slug = slugifyCustomerName(customerName)

    const stakeholdersPath = path.join(stakeholdersDir, `${slug}.json`)
    const strategyPath = path.join(strategyDir, `${slug}.json`)
    const competitorsPath = path.join(competitorsDir, `${slug}.json`)
    const actionsPath = path.join(actionsDir, `${slug}.json`)

    // Check if ANY files are missing
    const stakeholdersExist = existsSync(stakeholdersPath)
    const strategyExist = existsSync(strategyPath)
    const competitorsExist = existsSync(competitorsPath)
    const actionsExist = existsSync(actionsPath)

    const allExist = stakeholdersExist && strategyExist && competitorsExist && actionsExist

    if (allExist) {
      skipped++
      continue
    }

    // Generate and write missing files
    if (!stakeholdersExist) {
      const stakeholders = generateStakeholders(customerName)
      await writeFile(stakeholdersPath, JSON.stringify(stakeholders, null, 2))
    }

    if (!strategyExist) {
      const strategy = generateStrategy(customerName)
      await writeFile(strategyPath, JSON.stringify(strategy, null, 2))
    }

    if (!competitorsExist) {
      const competitors = generateCompetitors(customerName)
      await writeFile(competitorsPath, JSON.stringify(competitors, null, 2))
    }

    if (!actionsExist) {
      const actions = generateActions()
      await writeFile(actionsPath, JSON.stringify(actions, null, 2))
    }

    console.log(`✅ Generated data for: ${customerName}`)
    generated++
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✨ Demo data generation complete!`)
  console.log(`   Generated: ${generated} accounts`)
  console.log(`   Skipped (already exist): ${skipped} accounts`)
  console.log(`   Total: ${customers.length} accounts`)
  console.log('='.repeat(60))
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
}
