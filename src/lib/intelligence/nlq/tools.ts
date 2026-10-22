/**
 * Data tools for the natural language query agent. Each tool reads the
 * pre-built snapshots and returns compact JSON: a summary first, then the
 * matching rows, capped so one call can't flood the context.
 */
import { z } from 'zod'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import {
  getIntelligence,
  getCustomerIntelligence,
  summarizeRenewals,
  isAtRiskRenewal,
  groupSum,
  matchRows,
  type IntelligenceSnapshot,
} from '@/lib/data/server/intelligence-data'
import { getQueryDataContext } from './data-context'
import snapshot from '@/data/skyvera-snapshot.json'

const ROW_LIMIT = 40

const round = (n: number) => Math.round(n)
const json = (value: unknown) => JSON.stringify(value)

/** Case-insensitive "contains" filter for optional string arguments. */
function matches(value: string | null | undefined, filter?: string): boolean {
  if (!filter) return true
  return (value ?? '').toLowerCase().includes(filter.toLowerCase())
}

function capped<T>(rows: T[], limit = ROW_LIMIT) {
  return { rows: rows.slice(0, limit), shown: Math.min(rows.length, limit), total: rows.length }
}

function requireIntelligence(): IntelligenceSnapshot {
  const intel = getIntelligence()
  if (!intel) throw new Error('The operational snapshot is not loaded (run npm run refresh-data).')
  return intel
}

const buFilter = z
  .string()
  .optional()
  .describe('Business unit or product line, e.g. Cloudsense, Kandy, STL, NewNet, VoltDelta. Omit for all.')

export const queryTools = [
  betaZodTool({
    name: 'get_company_overview',
    description:
      'Current quarter P&L summary for the company and the Cloudsense, Kandy and STL business units ' +
      '(revenue, RR, NRR, margins, targets, EBITDA, prior plan RR), retention (DM%), and every ' +
      "customer's annual RR/NRR. Start here for most financial questions.",
    inputSchema: z.object({}),
    run: async () => json(getQueryDataContext() ?? { error: 'Budget snapshot not loaded' }),
  }),

  betaZodTool({
    name: 'get_customer',
    description:
      'Everything known about one customer: revenue, subscriptions and renewal status, Salesforce ' +
      'renewal opportunities, receivables over 90 days with the latest collection note, and ' +
      'non-recurring revenue. Names are matched loosely (case, punctuation, legal suffixes).',
    inputSchema: z.object({ name: z.string().describe('Customer name, e.g. "EMIRCOM" or "Telefonica UK"') }),
    run: async ({ name }) => {
      const all = Object.entries(snapshot.customers).flatMap(([bu, list]) =>
        (list as Array<{ customer_name: string; rr: number; nrr: number; total: number }>).map((c) => ({ ...c, bu }))
      )
      const revenue = matchRows(all, (c) => c.customer_name, name).map((c) => ({
        name: c.customer_name, bu: c.bu, annualRR: round(c.rr), annualNRR: round(c.nrr),
      }))
      const intel = getCustomerIntelligence(name)
      if (!revenue.length && !intel.renewals.length && !intel.receivable && !intel.pipeline.length && !intel.nrr.length) {
        return json({ error: `No customer matching "${name}"` })
      }
      return json({ revenue, ...intel })
    },
  }),

  betaZodTool({
    name: 'get_renewals',
    description:
      'Subscription renewals from the RR input: ARR (annual), renewal quarter, will-renew flag ' +
      '(Yes / No / No (SF) = at risk), up/down-sell %, projected ARR. Returns a per-quarter summary ' +
      'and matching subscriptions sorted by ARR. Covers all business units.',
    inputSchema: z.object({
      bu: buFilter,
      quarter: z.string().optional().describe('Renewal quarter like "Q4\'26", or "Next Yr"'),
      atRiskOnly: z.boolean().optional().describe('Only subscriptions marked No / No (SF)'),
    }),
    run: async ({ bu, quarter, atRiskOnly }) => {
      const intel = requireIntelligence()
      const rows = intel.renewals
        .filter((r) => matches(r.bu, bu) && (!quarter || r.renewalQuarter === quarter))
        .filter((r) => !atRiskOnly || isAtRiskRenewal(r))
        .sort((a, b) => b.arr - a.arr)
      return json({
        byQuarter: summarizeRenewals(rows).map((q) => ({ ...q, arr: round(q.arr), renewingArr: round(q.renewingArr), atRiskArr: round(q.atRiskArr) })),
        ...capped(rows.map((r) => ({
          customer: r.customer, bu: r.bu, quarter: r.renewalQuarter, renewalDate: r.renewalDate,
          arr: round(r.arr), willRenew: r.willRenew, upDownSellPct: r.upDownSellPct, projectedArr: round(r.projectedArr),
        }))),
      })
    },
  }),

  betaZodTool({
    name: 'get_pipeline',
    description:
      'Salesforce renewal opportunities: account, product line, stage (Pending, Quote Follow-Up, ' +
      'Proposal, Outreach, Engaged, Co-Term, Closed Lost), renewal and close dates, owner, ' +
      'probability, current ARR and renewal ARR. Returns totals by stage and matching opportunities.',
    inputSchema: z.object({
      bu: buFilter,
      stage: z.string().optional().describe('Filter by stage'),
      owner: z.string().optional().describe('Filter by opportunity owner'),
    }),
    run: async ({ bu, stage, owner }) => {
      const intel = requireIntelligence()
      const rows = intel.pipeline
        .filter((p) => matches(p.bu, bu) && matches(p.stage, stage) && matches(p.owner, owner))
        .sort((a, b) => b.currentArr - a.currentArr)
      return json({
        byStage: groupSum(rows, (p) => p.stage, (p) => p.currentArr).map((g) => ({ stage: g.name, opportunities: g.count, currentArr: round(g.total) })),
        ...capped(rows.map((p) => ({
          account: p.account, bu: p.bu, stage: p.stage, renewalDate: p.renewalDate, closeDate: p.closeDate,
          owner: p.owner, probabilityPct: p.probabilityPct, currentArr: round(p.currentArr), arr: round(p.arr),
        }))),
      })
    },
  }),

  betaZodTool({
    name: 'get_receivables',
    description:
      'Accounts receivable over 90 days (balances over $5K; the workbook has no other aging ' +
      'buckets): balance, ARR in budget, whether the balance exceeds 10% of ARR, whether the ' +
      "customer's revenue is included in budget, and the latest collection note.",
    inputSchema: z.object({
      bu: buFilter,
      minBalance: z.number().optional().describe('Only balances at or above this USD amount'),
    }),
    run: async ({ bu, minBalance }) => {
      const intel = requireIntelligence()
      const rows = intel.receivables.filter((r) => matches(r.bu, bu) && r.arOver90 >= (minBalance ?? 0))
      const total = rows.reduce((s, r) => s + r.arOver90, 0)
      return json({
        totalOver90: round(total),
        byBU: groupSum(rows, (r) => r.bu, (r) => r.arOver90).map((g) => ({ bu: g.name, customers: g.count, arOver90: round(g.total) })),
        ...capped(rows.map((r) => ({
          customer: r.customer, bu: r.bu, arOver90: round(r.arOver90), arrInBudget: round(r.arrInBudget),
          overTenPctOfArr: r.arOver10PctOfArr, revenueInBudget: r.revenueInBudget,
          latestNote: r.latestNote?.slice(0, 200) ?? null,
        })), 25),
      })
    },
  }),

  betaZodTool({
    name: 'get_vendors',
    description:
      'Vendor (non-headcount) costs from the vendor budget: per vendor line the BU, COGS/OPEX ' +
      'category, expense nature, this quarter vs prior-quarter forecast and budget, the next 3 ' +
      'quarters and the 4-quarter total, with comments. Returns totals by BU and nature.',
    inputSchema: z.object({
      bu: buFilter,
      vendor: z.string().optional().describe('Filter by vendor name'),
      minQuarterCost: z.number().optional().describe('Only lines costing at least this much this quarter'),
    }),
    run: async ({ bu, vendor, minQuarterCost }) => {
      const { vendors } = requireIntelligence()
      const [current] = vendors.quarters
      const rows = vendors.lines.filter(
        (v) => matches(v.bu, bu) && matches(v.vendor, vendor) && v.byQuarter[current] >= (minQuarterCost ?? 0)
      )
      return json({
        currentQuarter: current,
        priorQuarter: vendors.priorQuarter,
        totalThisQuarter: round(rows.reduce((s, v) => s + v.byQuarter[current], 0)),
        totalPriorQuarterForecast: round(rows.reduce((s, v) => s + v.priorQuarterForecast, 0)),
        byBU: groupSum(rows, (v) => v.bu, (v) => v.byQuarter[current]).map((g) => ({ bu: g.name, lines: g.count, cost: round(g.total) })),
        byNature: groupSum(rows, (v) => v.nature, (v) => v.byQuarter[current]).map((g) => ({ nature: g.name, cost: round(g.total) })),
        ...capped(rows.map((v) => ({
          vendor: v.vendor, bu: v.bu, category: v.category, nature: v.nature,
          thisQuarter: round(v.byQuarter[current]), priorQuarterForecast: round(v.priorQuarterForecast),
          byQuarter: Object.fromEntries(Object.entries(v.byQuarter).map(([q, n]) => [q, round(n)])),
          comments: v.comments?.slice(0, 160) ?? null,
        }))),
      })
    },
  }),

  betaZodTool({
    name: 'get_central_functions',
    description:
      'Central-function (CF) charges: Skyvera shared services billed to each business unit ' +
      '(AI usage, cloud usage, engineering Kanban slots, COO ops...), by service with prior-quarter ' +
      'budget and forecast and the coming quarters.',
    inputSchema: z.object({ bu: buFilter }),
    run: async ({ bu }) => {
      const { centralFunctions } = requireIntelligence()
      const current = centralFunctions.periods[2]
      const rows = centralFunctions.lines.filter((l) => matches(l.bu, bu)).sort((a, b) => b.cost[current] - a.cost[current])
      return json({
        periods: centralFunctions.periods,
        totalThisQuarter: round(rows.reduce((s, l) => s + l.cost[current], 0)),
        byBU: groupSum(rows, (l) => l.bu, (l) => l.cost[current]).map((g) => ({ bu: g.name, cost: round(g.total) })),
        byGroup: groupSum(rows, (l) => l.group, (l) => l.cost[current]).map((g) => ({ group: g.name, cost: round(g.total) })),
        ...capped(rows.map((l) => ({
          service: l.service, bu: l.bu, category: l.category, group: l.group,
          cost: Object.fromEntries(Object.entries(l.cost).map(([p, n]) => [p, round(n)])),
        }))),
      })
    },
  }),

  betaZodTool({
    name: 'get_headcount',
    description:
      'Headcount and people cost, aggregated (no individuals): quarter-end and average heads, cost ' +
      'by quarter, by department, location, vertical, COGS vs OPEX and employment type (XO ' +
      'contractor vs non-XO), team view with prior-quarter comparison, and cost adjustments.',
    inputSchema: z.object({}),
    run: async () => json(requireIntelligence().headcount),
  }),

  betaZodTool({
    name: 'get_ai_cost',
    description: 'AI tooling cost and HC cost vs revenue, this quarter vs the same quarter a year earlier, with AI cost by vendor.',
    inputSchema: z.object({}),
    run: async () => json(requireIntelligence().aiCost),
  }),

  betaZodTool({
    name: 'get_product_pnl',
    description:
      'P&L by product line (Cloudsense, Kandy, STL, NewNet, VoltDelta, Service Gateway, ' +
      'ResponseTek, Mobilogy) for the current and the next three budget quarters: revenue, HC, ' +
      'vendor (NHC) and central-function costs, core allocation, net profit and net margin %, ' +
      'plus each line\'s margin target.',
    inputSchema: z.object({}),
    run: async () => {
      const intel = requireIntelligence()
      return json({ periods: intel.products, marginTargets: intel.marginTargets })
    },
  }),

  betaZodTool({
    name: 'get_cost_benchmark',
    description:
      "Each product line's cost structure as % of revenue against Skyvera's internal cost model " +
      '(not peer companies): central, edge, hard COGS, total cost and margin vs model, the $ ' +
      'variance to the model per quarter, and the model\'s action rules.',
    inputSchema: z.object({}),
    run: async () => json(requireIntelligence().benchmark),
  }),

  betaZodTool({
    name: 'get_financial_history',
    description:
      'Consolidated income statement by quarter: actuals (from Q4 a year ago), the current forecast ' +
      'and budget, and the coming budget quarters. Revenue, COGS, gross margin, expenses, net ' +
      'margin, HC/NHC/CF spend, bad-debt provision.',
    inputSchema: z.object({}),
    run: async () => json(requireIntelligence().history),
  }),

  betaZodTool({
    name: 'get_nonrecurring_revenue',
    description: 'Non-recurring revenue (consulting/PS and one-off sales) by customer and class: trailing 12 months and the next four quarters.',
    inputSchema: z.object({
      customer: z.string().optional(),
      revenueClass: z.string().optional().describe('e.g. "Cloudsense Consulting", "NewNet Product"'),
    }),
    run: async ({ customer, revenueClass }) => {
      const { nrr } = requireIntelligence()
      const rows = nrr.lines.filter((l) => matches(l.customer, customer) && matches(l.class, revenueClass))
      return json({
        quarters: nrr.quarters,
        byClass: groupSum(rows, (l) => l.class, (l) => l.trailing12Months).map((g) => ({ class: g.name, trailing12Months: round(g.total) })),
        ...capped(rows),
      })
    },
  }),
]
