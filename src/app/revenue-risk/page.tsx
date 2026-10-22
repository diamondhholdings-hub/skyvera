/**
 * Revenue risk: where recurring revenue is at risk. Renewals marked not to
 * renew, the Salesforce renewal pipeline, and receivables over 90 days.
 *
 * Server Component. Tab and business-unit filter live in the URL
 * (?tab=renewals|pipeline|receivables&bu=Kandy) so views are bookmarkable;
 * both are plain links, so no client JavaScript is needed.
 */

import Link from 'next/link'
import { CircleX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiStrip } from '@/components/ui/kpi-strip'
import { getIntelligence } from '@/lib/data/server/intelligence-data'
import { getFiscalQuarter } from '@/lib/data/server/fiscal-quarter'
import {
  TABS,
  type TabId,
  businessUnits,
  computeKpis,
  filterByBU,
  parseBU,
  parseTab,
} from './_lib/view-model'
import { formatMoney, formatPct } from './_lib/format'
import { RenewalsTab } from './_components/renewals-tab'
import { PipelineTab } from './_components/pipeline-tab'
import { ReceivablesTab } from './_components/receivables-tab'

export const metadata = {
  title: 'Revenue risk - Skyvera',
  description: 'Renewals at risk, the renewal pipeline and receivables over 90 days',
}

interface RevenueRiskPageProps {
  searchParams: Promise<{ tab?: string; bu?: string }>
}

function hrefFor(tab: TabId, bu: string | null): string {
  const params = new URLSearchParams({ tab })
  if (bu) params.set('bu', bu)
  return `?${params.toString()}`
}

export default async function RevenueRiskPage({ searchParams }: RevenueRiskPageProps) {
  const params = await searchParams
  const intel = getIntelligence()

  if (!intel) {
    return (
      <div>
        <PageHeader title="Revenue risk" subtitle="Renewals, renewal pipeline and receivables over 90 days" />
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <div className="alert-box alert-critical flex max-w-2xl items-start gap-3" role="alert">
            <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-sm font-semibold">Revenue risk data is not available</h2>
              <p className="m-0 mt-1 text-sm">
                The intelligence snapshot has not been generated. Run npm run refresh-data to build it from the
                budget workbook.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tab = parseTab(params.tab)
  const buOptions = businessUnits(intel)
  const bu = parseBU(params.bu, buOptions)
  const data = filterByBU(intel, bu)
  const currentQuarter = getFiscalQuarter()
  const kpis = computeKpis(data, currentQuarter)

  const largest = kpis.arOver90.largest
  const largestShare = largest && kpis.arOver90.total > 0 ? (largest.arOver90 / kpis.arOver90.total) * 100 : 0
  const scope = bu ?? 'All business units'

  return (
    <div>
      {/* Server Components can't take event handlers; link hover comes from CSS */}
      <style>{`
        .rr-link { color: var(--secondary); text-decoration: none; }
        .rr-link:hover { text-decoration: underline; }
        .rr-note summary { cursor: pointer; }
        .rr-note summary:hover { color: var(--ink); }
      `}</style>

      <PageHeader
        title="Revenue risk"
        subtitle={`${scope} · ${currentQuarter ? `${currentQuarter} ` : ''}budget workbook and Salesforce renewal pipeline`}
      >
        <KpiStrip
          items={[
            {
              label: currentQuarter ? `ARR renewing in ${currentQuarter}` : 'ARR renewing this quarter',
              value: formatMoney(kpis.renewingThisQuarter.arr),
              context: `${kpis.renewingThisQuarter.count} subscriptions · ${formatMoney(kpis.renewingThisQuarter.atRiskArr)} marked not renewing`,
            },
            {
              label: 'ARR at risk, next 4 quarters',
              value: formatMoney(kpis.atRiskNext4.arr),
              context: kpis.atRiskNext4.from && kpis.atRiskNext4.to
                ? `${kpis.atRiskNext4.count} subscriptions marked No or No (SF), ${kpis.atRiskNext4.from} to ${kpis.atRiskNext4.to}`
                : `${kpis.atRiskNext4.count} subscriptions marked No or No (SF)`,
              tone: kpis.atRiskNext4.arr > 0 ? 'critical' : 'default',
            },
            {
              label: 'AR over 90 days',
              value: formatMoney(kpis.arOver90.total),
              context: largest
                ? `${kpis.arOver90.customers} customers · ${largest.customer} ${formatPct(largestShare)}`
                : `${kpis.arOver90.customers} customers`,
              tone: kpis.arOver90.total > 0 ? 'warning' : 'default',
            },
            {
              label: 'Open renewal pipeline ARR',
              value: formatMoney(kpis.openPipeline.arr),
              context: `${kpis.openPipeline.count} open opportunities, excludes Closed Lost`,
            },
          ]}
        />
      </PageHeader>

      <nav aria-label="Revenue risk sections" className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto px-4 lg:px-8">
          {TABS.map(({ id, label }) => (
            <Link
              key={id}
              href={hrefFor(id, bu)}
              scroll={false}
              prefetch={false}
              className="dashboard-tab shrink-0"
              aria-current={tab === id ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="section-label" id="bu-filter-label">Business unit</span>
          <div className="max-w-full overflow-x-auto">
            <nav aria-labelledby="bu-filter-label" className="segmented">
              <Link href={hrefFor(tab, null)} scroll={false} prefetch={false} aria-current={bu === null ? 'page' : undefined}>
                All
              </Link>
              {buOptions.map((name) => (
                <Link
                  key={name}
                  href={hrefFor(tab, name)}
                  scroll={false}
                  prefetch={false}
                  aria-current={bu === name ? 'page' : undefined}
                >
                  {name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {tab === 'renewals' && <RenewalsTab renewals={data.renewals} currentQuarter={currentQuarter} />}
        {tab === 'pipeline' && <PipelineTab pipeline={data.pipeline} />}
        {tab === 'receivables' && <ReceivablesTab receivables={data.receivables} />}
      </div>
    </div>
  )
}
