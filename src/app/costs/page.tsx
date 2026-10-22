/**
 * Costs page: where the money goes and whether it is in line with the cost
 * model. Vendors, central-function charges, headcount (aggregated only), AI
 * tooling cost and the internal cost benchmark.
 *
 * Server Component. Data comes only from the intelligence snapshot.
 * URL state: ?tab=vendors|central|headcount|ai|benchmark and optional ?bu=.
 */
import Link from 'next/link'
import { getIntelligence } from '@/lib/data/server/intelligence-data'
import { PageHeader } from '@/components/ui/page-header'
import { KpiStrip } from '@/components/ui/kpi-strip'
import { EmptyState } from '@/components/ui/empty-state'
import { costBUs, resolveBU, summarizeCosts } from './_components/cost-summary'
import { pct, pctChange, usdCompact } from './_components/format'
import { buildHref } from './_components/ui'
import { VendorsTab } from './_components/vendors-tab'
import { CentralTab } from './_components/central-tab'
import { HeadcountTab } from './_components/headcount-tab'
import { AiTab } from './_components/ai-tab'
import { BenchmarkTab } from './_components/benchmark-tab'

export const metadata = {
  title: 'Costs - Skyvera',
  description: 'Vendors, central-function charges, headcount, AI cost and the cost model benchmark',
}

const TABS = [
  { id: 'vendors', label: 'Vendors' },
  { id: 'central', label: 'Central services' },
  { id: 'headcount', label: 'Headcount' },
  { id: 'ai', label: 'AI cost' },
  { id: 'benchmark', label: 'Cost benchmark' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Tabs where the ?bu= filter applies; it is kept in links for the others */
const BU_TABS: TabId[] = ['vendors', 'central']

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; bu?: string }>
}) {
  const params = await searchParams
  const activeTab: TabId = TABS.some((t) => t.id === params.tab) ? (params.tab as TabId) : 'vendors'
  const intel = getIntelligence()

  if (!intel) {
    return (
      <div>
        <PageHeader title="Costs" subtitle="Vendors, central services, headcount and the cost model" />
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <EmptyState
            title="Cost data has not been generated"
            description="Run npm run refresh-data to build the intelligence snapshot from the budget workbook."
          />
        </div>
      </div>
    )
  }

  const bus = costBUs(intel)
  const bu = resolveBU(params.bu, bus)
  const s = summarizeCosts(intel)

  const vendorChange = s.vendorSpend - s.vendorPriorForecast
  const overModel = s.totalCostPct > s.totalCostModelPct

  return (
    <div className="costs-page">
      <PageHeader
        title="Costs"
        subtitle={`Where the money goes · ${s.quarter} budget, all business units`}
      >
        <KpiStrip
          items={[
            {
              label: 'Vendor spend',
              value: usdCompact(s.vendorSpend),
              context: `${vendorChange <= 0 ? 'Down' : 'Up'} ${pct(Math.abs(pctChange(s.vendorSpend, s.vendorPriorForecast) ?? 0))} vs ${s.priorQuarter} forecast ${usdCompact(s.vendorPriorForecast)}`,
            },
            {
              label: 'Central-function charges',
              value: usdCompact(s.centralCharges),
              context: `${s.centralPriorPeriod.replace('Fcst', 'forecast')} ${usdCompact(s.centralPriorForecast)}`,
            },
            {
              label: 'Headcount',
              value: String(s.headcount),
              context: `${s.priorQuarter} ${s.priorHeadcount} · cost ${usdCompact(s.hcCost)}`,
            },
            {
              label: 'AI cost',
              value: usdCompact(s.aiCost),
              context: `${s.aiYearAgo} ${usdCompact(s.aiCostYearAgo)} · HC + AI ${pct(s.hcAiPctOfRevenue)} of revenue`,
              tone: s.hcAiPctOfRevenue > s.hcAiPctOfRevenueYearAgo ? 'warning' : 'default',
            },
            {
              label: 'Total cost, % of revenue',
              value: pct(s.totalCostPct),
              context: `${overModel ? 'Over' : 'Within'} the ${pct(s.totalCostModelPct, 0)} model · ${usdCompact(Math.abs(s.varianceVsModel))}/qtr ${s.varianceVsModel >= 0 ? 'over' : 'under'}`,
              tone: overModel ? 'critical' : 'success',
            },
          ]}
        />
      </PageHeader>

      <nav aria-label="Cost sections" className="border-b" style={{ background: 'var(--paper)', borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto px-4 lg:px-8">
          {TABS.map(({ id, label }) => (
            <Link
              key={id}
              href={buildHref(id, BU_TABS.includes(id) ? bu : null)}
              scroll={false}
              prefetch={false}
              className="dashboard-tab shrink-0"
              aria-current={activeTab === id ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <main id="tab-panel" className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {activeTab === 'vendors' && <VendorsTab intel={intel} bus={bus} bu={bu} />}
        {activeTab === 'central' && <CentralTab intel={intel} summary={s} bus={bus} bu={bu} />}
        {activeTab === 'headcount' && <HeadcountTab intel={intel} summary={s} />}
        {activeTab === 'ai' && <AiTab intel={intel} />}
        {activeTab === 'benchmark' && <BenchmarkTab intel={intel} />}
      </main>

      {/* Row headers read as body text; table totals get a heavier rule */}
      <style>{`
        .costs-page .data-table tbody th {
          font-size: inherit; color: var(--ink); background: transparent; font-weight: 500;
          padding: 0.625rem 0.75rem; white-space: normal;
        }
        .costs-page .data-table tfoot th,
        .costs-page .data-table tfoot td {
          border-top: 1px solid var(--border-strong); border-bottom: 0; font-weight: 600; color: var(--ink);
          background: var(--surface); font-size: inherit; padding: 0.625rem 0.75rem;
        }
        .costs-page details > summary { list-style-position: inside; }
      `}</style>
    </div>
  )
}
