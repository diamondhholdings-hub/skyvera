/**
 * Salesforce data sync — pulls Account, Contacts, Opportunities, Cases
 * and maps them to the account plan JSON file format
 */
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import { getSalesforceConnection } from './client'
import { slugifyCustomerName } from '@/lib/data/server/account-plan-data'

export interface SalesforceSyncResult {
  accountName: string
  synced: {
    stakeholders: number
    opportunities: number
    competitors: number
    actions: number
  }
  errors: string[]
  syncedAt: string
}

/**
 * Find a Salesforce Account by name (case-insensitive fuzzy match)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findAccount(conn: any, accountName: string) {
  const safeName = accountName.replace(/'/g, "\\'")
  const result = await conn.query(
    `SELECT Id, Name, Industry, AnnualRevenue, NumberOfEmployees, 
     BillingCity, BillingCountry, Website, Description,
     OwnerId, Owner.Name
     FROM Account 
     WHERE Name LIKE '%${safeName}%' 
     LIMIT 5`
  )
  if (result.records.length === 0) return null
  // Return best match (exact first, then first fuzzy)
  const exact = result.records.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => r.Name.toLowerCase() === accountName.toLowerCase()
  )
  return exact || result.records[0]
}

/**
 * Pull Contacts for an account and map to Stakeholder format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncContacts(conn: any, accountId: string, customerName: string): Promise<number> {
  const result = await conn.query(
    `SELECT Id, Name, Title, Email, Phone, Department, LeadSource,
     ReportsToId, ReportsTo.Name
     FROM Contact 
     WHERE AccountId = '${accountId}'
     ORDER BY Name`
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stakeholders = result.records.map((c: any) => ({
    id: c.Id,
    name: c.Name,
    title: c.Title || 'Contact',
    role: inferRole(c.Title || '', c.Department || ''),
    email: c.Email || undefined,
    phone: c.Phone || undefined,
    reportsTo: c.ReportsToId || null,
    relationshipStrength: 'moderate' as const,
    notes: c.Department ? `Department: ${c.Department}` : undefined,
  }))

  const slug = slugifyCustomerName(customerName)
  const dir = path.join(process.cwd(), 'data/account-plans/stakeholders')
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(dir, `${slug}.json`),
    JSON.stringify(stakeholders, null, 2)
  )

  return stakeholders.length
}

/**
 * Infer stakeholder role from title and department
 */
function inferRole(title: string, department: string): string {
  const t = title.toLowerCase()
  const d = department.toLowerCase()
  if (t.includes('ceo') || t.includes('chief executive') || t.includes('president')) return 'decision-maker'
  if (t.includes('cto') || t.includes('cio') || t.includes('coo') || t.includes('cfo')) return 'decision-maker'
  if (t.includes('vp') || t.includes('vice president') || t.includes('director')) return 'decision-maker'
  if (t.includes('manager') || t.includes('head of')) return 'influencer'
  if (d.includes('it') || d.includes('technology') || d.includes('engineering')) return 'influencer'
  return 'user'
}

/**
 * Pull Opportunities for an account and map to strategy opportunities format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncOpportunities(conn: any, accountId: string, customerName: string): Promise<number> {
  const result = await conn.query(
    `SELECT Id, Name, Amount, StageName, CloseDate, Probability, Description,
     Type, LeadSource
     FROM Opportunity 
     WHERE AccountId = '${accountId}' AND IsClosed = false
     ORDER BY Amount DESC NULLS LAST`
  )

  // Map SF stage to our status
  const stageToStatus: Record<string, string> = {
    'Prospecting': 'identified',
    'Qualification': 'exploring',
    'Needs Analysis': 'exploring',
    'Value Proposition': 'proposed',
    'Id. Decision Makers': 'proposed',
    'Perception Analysis': 'proposed',
    'Proposal/Price Quote': 'proposed',
    'Negotiation/Review': 'proposed',
    'Closed Won': 'won',
    'Closed Lost': 'lost',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunities = result.records.map((o: any) => ({
    id: o.Id,
    title: o.Name,
    description: o.Description || `${o.Type || 'Opportunity'} — ${o.StageName}`,
    status: stageToStatus[o.StageName] || 'identified',
    estimatedValue: o.Amount ? Math.round(o.Amount) : undefined,
    probability: o.Probability ? Math.round(o.Probability) : undefined,
    identifiedDate: o.CloseDate || new Date().toISOString().split('T')[0],
  }))

  // Load existing strategy data and merge opportunities
  const slug = slugifyCustomerName(customerName)
  const strategyDir = path.join(process.cwd(), 'data/account-plans/strategy')
  await mkdir(strategyDir, { recursive: true })

  let existingStrategy: { painPoints: unknown[]; opportunities: unknown[] } = {
    painPoints: [],
    opportunities: [],
  }
  try {
    const existing = await readFile(path.join(strategyDir, `${slug}.json`), 'utf-8')
    existingStrategy = JSON.parse(existing)
  } catch {
    // File doesn't exist yet — use defaults
  }

  const merged = {
    painPoints: existingStrategy.painPoints || [],
    opportunities,
  }

  await writeFile(
    path.join(strategyDir, `${slug}.json`),
    JSON.stringify(merged, null, 2)
  )

  return opportunities.length
}

/**
 * Pull Cases as action items
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncCases(conn: any, accountId: string, customerName: string): Promise<number> {
  const result = await conn.query(
    `SELECT Id, Subject, Description, Status, Priority, OwnerId, Owner.Name,
     CreatedDate, ClosedDate
     FROM Case 
     WHERE AccountId = '${accountId}' AND Status != 'Closed'
     ORDER BY Priority, CreatedDate DESC
     LIMIT 50`
  )

  const statusMap: Record<string, string> = {
    'New': 'todo',
    'Open': 'todo',
    'Working': 'in-progress',
    'In Progress': 'in-progress',
    'Escalated': 'in-progress',
    'Closed': 'done',
  }

  const priorityMap: Record<string, string> = {
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = result.records.map((c: any) => ({
    id: c.Id,
    title: c.Subject,
    description: c.Description || undefined,
    status: statusMap[c.Status] || 'todo',
    priority: priorityMap[c.Priority] || 'medium',
    owner: c.Owner?.Name || undefined,
    createdAt: c.CreatedDate,
  }))

  const slug = slugifyCustomerName(customerName)
  const dir = path.join(process.cwd(), 'data/account-plans/actions')
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(dir, `${slug}.json`),
    JSON.stringify(actions, null, 2)
  )

  return actions.length
}

/**
 * Main sync function — pulls all data for an account from Salesforce
 */
export async function syncAccountFromSalesforce(customerName: string): Promise<SalesforceSyncResult> {
  const result: SalesforceSyncResult = {
    accountName: customerName,
    synced: { stakeholders: 0, opportunities: 0, competitors: 0, actions: 0 },
    errors: [],
    syncedAt: new Date().toISOString(),
  }

  try {
    const conn = await getSalesforceConnection()
    const account = await findAccount(conn, customerName)

    if (!account) {
      result.errors.push(`Account "${customerName}" not found in Salesforce`)
      return result
    }

    // Run all syncs in parallel
    const [contactCount, opportunityCount, caseCount] = await Promise.all([
      syncContacts(conn, account.Id, customerName).catch((e: Error) => {
        result.errors.push(`Contacts: ${e.message}`)
        return 0
      }),
      syncOpportunities(conn, account.Id, customerName).catch((e: Error) => {
        result.errors.push(`Opportunities: ${e.message}`)
        return 0
      }),
      syncCases(conn, account.Id, customerName).catch((e: Error) => {
        result.errors.push(`Cases: ${e.message}`)
        return 0
      }),
    ])

    result.synced.stakeholders = contactCount
    result.synced.opportunities = opportunityCount
    result.synced.actions = caseCount
  } catch (error) {
    result.errors.push(
      `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}
