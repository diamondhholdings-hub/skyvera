/**
 * Enrich all account plans with AI-generated data using Claude Haiku.
 * Generates: stakeholders, strategy, competitors, actions, intelligence
 * Runs in parallel batches of 8 to stay within rate limits.
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env manually
const __envPath = new URL('../.env', import.meta.url).pathname
if (fs.existsSync(__envPath)) {
  for (const line of fs.readFileSync(__envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'data')
const PLANS = path.join(DATA, 'account-plans')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'
const BATCH_SIZE = 8
const INTELLIGENCE_BATCH_SIZE = 4 // larger prompts, smaller batch

// BU context for AI prompts
const BU_CONTEXT = {
  CloudSense: {
    product: 'CloudSense CPQ (Configure, Price, Quote) — a Salesforce-native BSS/CPQ platform for telecoms',
    vertical: 'telecommunications BSS/CPQ, product catalog, order management, and billing on Salesforce',
    competitors: ['Amdocs', 'Comverse', 'NetCracker', 'Oracle Communications', 'Ericsson', 'Huawei'],
  },
  Kandy: {
    product: 'Kandy UCaaS — Unified Communications as a Service platform (CPaaS, WebRTC, SIP trunking, messaging)',
    vertical: 'unified communications, CPaaS, WebRTC, SIP trunking, cloud communications',
    competitors: ['Twilio', 'Vonage', 'RingCentral', 'Cisco Webex', 'Microsoft Teams Direct Routing', 'Bandwidth'],
  },
  STL: {
    product: 'STL (Software Technology Labs) — telecom software professional services and custom development',
    vertical: 'telecom software engineering, systems integration, custom development for carriers',
    competitors: ['Wipro', 'Infosys', 'TCS', 'Accenture', 'Capgemini', 'Tech Mahindra'],
  },
  NewNet: {
    product: 'NewNet Communications — SS7, LTE, IMS, and next-gen signaling software for carriers',
    vertical: 'telecom signaling, SS7/Diameter/SIP core network software, roaming, SMS interworking',
    competitors: ['Mavenir', 'Ulticom', 'Teligent Telecom', 'Compunetix', 'Neustar'],
  },
}

// Slugify matching app logic
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Load all customers
function loadAllCustomers() {
  const files = [
    'customers_cloudsense_all.json',
    'customers_kandy_all.json',
    'customers_stl_all.json',
    'customers_newnet_all.json',
  ]
  const customers = []
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(DATA, f)))
      const list = Array.isArray(d) ? d : (d.customers || [])
      const bu = d.bu_name || f.replace('customers_', '').replace('_all.json', '')
      for (const c of list) {
        customers.push({ ...c, bu: c.bu || bu })
      }
    } catch (e) {}
  }
  // Deduplicate by slug
  const seen = new Set()
  const unique = []
  for (const c of customers) {
    const slug = slugify(c.customer_name || '')
    if (slug && !seen.has(slug)) {
      seen.add(slug)
      unique.push({ ...c, slug })
    }
  }
  return unique
}

// Skip junk entries
function isJunk(name) {
  return name.toLowerCase().includes('various:') || name.toLowerCase().includes('license increment')
}

// Ensure directory exists
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

// Generate with Claude
async function generate(prompt, systemPrompt) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content[0].text.trim()
  // Extract JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/s)
  if (jsonMatch) return JSON.parse(jsonMatch[1])
  return JSON.parse(text)
}

// --- Generators ---

async function generateStakeholders(customer) {
  const buCtx = BU_CONTEXT[customer.bu] || BU_CONTEXT.CloudSense
  const prompt = `Generate realistic stakeholder contacts for ${customer.customer_name}, a telecom company using ${buCtx.product}.
ARR: $${Math.round((customer.rr || 0) * 4).toLocaleString()}. Region: infer from company name.

Return a JSON array of 3-4 stakeholders. Each must have:
- id: "${customer.slug}-s-001" format
- name: realistic full name
- title: realistic C-level/VP/Director title
- role: one of "decision-maker" | "champion" | "influencer" | "blocker" | "user"
- relationshipStrength: "strong" | "moderate" | "weak"
- email: realistic corporate email
- notes: 1-2 sentences on their priorities relevant to ${buCtx.vertical}
- interests: array of 2-3 business interests
- lastInteraction: ISO date in 2025-2026 range

Return ONLY the JSON array, no other text.`

  return generate(prompt, 'You are a B2B SaaS CRM data generator for telecom industry account plans. Return only valid JSON.')
}

async function generateStrategy(customer) {
  const buCtx = BU_CONTEXT[customer.bu] || BU_CONTEXT.CloudSense
  const arr = Math.round((customer.rr || 0) * 4)
  const prompt = `Generate a strategic account plan for ${customer.customer_name} (${customer.bu} BU).
They use ${buCtx.product}. ARR: $${arr.toLocaleString()}.

Return a JSON object with exactly two keys:
- "painPoints": array of 2-3 pain points, each with: id, title, description, status ("active"|"resolved"), severity ("high"|"medium"|"low"), identifiedDate (ISO), owner
- "opportunities": array of 2 growth opportunities, each with: id, title, description, status ("proposed"|"exploring"|"active"), estimatedValue (number USD), probability (0-100 integer), identifiedDate (ISO), owner

Make pain points specific to ${buCtx.vertical} challenges. Opportunities should reference realistic expansion of ${buCtx.product} usage.
Return ONLY the JSON object, no other text.`

  return generate(prompt, 'You are a B2B SaaS strategic account planner for telecom industry. Return only valid JSON.')
}

async function generateCompetitors(customer) {
  const buCtx = BU_CONTEXT[customer.bu] || BU_CONTEXT.CloudSense
  const prompt = `Generate 2 competitive threats for ${customer.customer_name}'s account with Skyvera's ${buCtx.product}.

Return a JSON array of 2 competitors. Each must have:
- id: "${customer.slug}-c-001" format
- name: real competitor company name from: ${buCtx.competitors.join(', ')}
- type: "our-competitor" (competing with Skyvera) or "customer-competitor" (competing with the customer themselves) or "both"
- description: 1 sentence
- strengths: array of 2-3 real strengths
- weaknesses: array of 2-3 real weaknesses vs Skyvera
- lastUpdated: "2026-02-01"

Return ONLY the JSON array, no other text.`

  return generate(prompt, 'You are a competitive intelligence analyst for telecom SaaS. Return only valid JSON.')
}

async function generateActions(customer) {
  const buCtx = BU_CONTEXT[customer.bu] || BU_CONTEXT.CloudSense
  const arr = Math.round((customer.rr || 0) * 4)
  const prompt = `Generate 4 action items for the account team managing ${customer.customer_name} (ARR: $${arr.toLocaleString()}).
They use ${buCtx.product}. Create a mix of statuses: 1 "done", 1 "in-progress", 2 "todo".

Return a JSON array of 4 action items. Each must have:
- id: "${customer.slug}-a-001" format
- title: specific action (e.g. "Schedule QBR with CTO", "Prepare renewal proposal")
- description: 1 sentence of context
- status: "todo" | "in-progress" | "done"
- priority: "high" | "medium" | "low"
- owner: role name (e.g. "Account Manager", "Solutions Engineer", "Customer Success")
- dueDate: ISO date in Q1-Q2 2026 range
- createdAt: ISO date in Jan-Feb 2026

Return ONLY the JSON array, no other text.`

  return generate(prompt, 'You are a B2B SaaS account manager for telecom industry. Return only valid JSON.')
}

async function generateIntelligence(customer) {
  const buCtx = BU_CONTEXT[customer.bu] || BU_CONTEXT.CloudSense
  const arr = Math.round((customer.rr || 0) * 4)
  const renewalInfo = customer.subscriptions?.map(s => `${s.sub_id}: ${s.renewal_qtr}, will_renew=${s.will_renew}`).join('; ') || 'unknown'

  const prompt = `Write a Customer Intelligence Report for ${customer.customer_name}.

Context:
- Skyvera Product: ${buCtx.product}
- Business Unit: ${customer.bu}
- ARR: $${arr.toLocaleString()}
- Renewal Info: ${renewalInfo}
- Industry: Telecommunications

Write a structured markdown intelligence report with these ## sections:
## Executive Summary
## Company Intelligence
## Executive Leadership
## Market Context
## Competitive Landscape
## Opportunity Analysis
## Risk Assessment
## Account Strategy Recommendations
## Key Findings Summary

Each section should be 3-6 sentences. Be specific to ${customer.customer_name}'s likely business context (infer from their name and region). Use bold for key terms. Include a markdown table in Executive Summary for key metrics.

Return ONLY the markdown report, starting with # ${customer.customer_name} Intelligence Report`

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: 'You are a senior B2B SaaS customer intelligence analyst specializing in telecom. Write detailed, realistic intelligence reports.',
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content[0].text.trim()
}

// --- Main ---

async function enrichAccount(customer, types) {
  const slug = customer.slug
  const results = { slug, generated: [], errors: [] }

  for (const type of types) {
    const filePath = path.join(PLANS, type, `${slug}.json`)
    ensureDir(path.join(PLANS, type))

    try {
      let data
      if (type === 'stakeholders') data = await generateStakeholders(customer)
      else if (type === 'strategy') data = await generateStrategy(customer)
      else if (type === 'competitors') data = await generateCompetitors(customer)
      else if (type === 'actions') data = await generateActions(customer)

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      results.generated.push(type)
    } catch (e) {
      results.errors.push(`${type}: ${e.message}`)
    }
  }
  return results
}

async function enrichIntelligence(customer) {
  const slug = customer.slug
  const filePath = path.join(PLANS, 'intelligence', `${slug}.json`)
  ensureDir(path.join(PLANS, 'intelligence'))
  try {
    const raw = await generateIntelligence(customer)
    fs.writeFileSync(filePath, JSON.stringify({ raw }, null, 2))
    return { slug, ok: true }
  } catch (e) {
    return { slug, ok: false, error: e.message }
  }
}

async function runBatch(items, fn, label) {
  const results = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    process.stdout.write(`  [${label}] ${i + 1}-${Math.min(i + BATCH_SIZE, items.length)} / ${items.length}...\r`)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

async function main() {
  console.log('Loading customers...')
  const customers = loadAllCustomers().filter(c => !isJunk(c.customer_name))
  console.log(`Loaded ${customers.length} valid accounts\n`)

  const audit = JSON.parse(fs.readFileSync(path.join(DATA, 'account-plan-audit.json')))

  // --- Phase 1: Generate missing plan files (15 accounts) ---
  const missingAll = customers.filter(c =>
    audit.incomplete.some(i => i.slug === c.slug)
  )
  console.log(`Phase 1: Generating all plan files for ${missingAll.length} accounts...`)
  const phase1Results = await runBatch(
    missingAll,
    (c) => enrichAccount(c, ['stakeholders', 'strategy', 'competitors', 'actions']),
    'plan-files'
  )
  const p1ok = phase1Results.filter(r => r.errors.length === 0).length
  const p1err = phase1Results.filter(r => r.errors.length > 0)
  console.log(`\n  ✓ ${p1ok} accounts generated fully`)
  if (p1err.length) console.log(`  ✗ Errors:`, p1err.map(r => `${r.slug}: ${r.errors.join(', ')}`))

  // --- Phase 2: Fill empty actions (109 accounts) ---
  const emptyActionSlugs = new Set(audit.emptyDetails?.actions || [])
  // Re-check current state
  const needsActions = customers.filter(c => {
    const fp = path.join(PLANS, 'actions', `${c.slug}.json`)
    if (!fs.existsSync(fp)) return false
    try {
      const d = JSON.parse(fs.readFileSync(fp))
      return Array.isArray(d) ? d.length === 0 : true
    } catch { return true }
  })
  console.log(`\nPhase 2: Generating actions for ${needsActions.length} accounts with empty actions...`)
  const phase2Results = await runBatch(
    needsActions,
    (c) => enrichAccount(c, ['actions']),
    'actions'
  )
  const p2ok = phase2Results.filter(r => r.errors.length === 0).length
  console.log(`\n  ✓ ${p2ok} action lists generated`)

  // --- Phase 3: Intelligence reports for all accounts ---
  const allValid = customers
  const intBatchSize = INTELLIGENCE_BATCH_SIZE
  console.log(`\nPhase 3: Generating intelligence reports for ${allValid.length} accounts (batch size ${intBatchSize})...`)

  const intResults = []
  for (let i = 0; i < allValid.length; i += intBatchSize) {
    const batch = allValid.slice(i, i + intBatchSize)
    process.stdout.write(`  [intelligence] ${i + 1}-${Math.min(i + intBatchSize, allValid.length)} / ${allValid.length}...\r`)
    const batchResults = await Promise.all(batch.map(enrichIntelligence))
    intResults.push(...batchResults)
  }

  const intOk = intResults.filter(r => r.ok).length
  const intErr = intResults.filter(r => !r.ok)
  console.log(`\n  ✓ ${intOk} intelligence reports generated`)
  if (intErr.length) console.log(`  ✗ Errors:`, intErr.slice(0, 5).map(r => `${r.slug}: ${r.error}`))

  console.log('\n=== Enrichment Complete ===')
  console.log(`Plan files: ${p1ok}/${missingAll.length}`)
  console.log(`Actions filled: ${p2ok}/${needsActions.length}`)
  console.log(`Intelligence: ${intOk}/${allValid.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
