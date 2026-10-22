/**
 * Headline figures for the dashboard page header.
 * Server Component; streams in under the title via <Suspense> so the
 * heading renders immediately.
 */

import Link from 'next/link'
import { getDashboardData } from '@/lib/data/server/dashboard-data'
import { KpiStrip, type KpiItem } from '@/components/ui/kpi-strip'

export async function HeadlineKpis() {
  const result = await getDashboardData()
  if (!result.success) {
    return (
      <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>
        Headline figures could not be loaded.
      </p>
    )
  }

  const data = result.value
  const rrPercentage = data.totalRevenue > 0 ? (data.totalRR / data.totalRevenue) * 100 : 0
  const arr = data.totalRR * 4
  const marginGap = data.ebitda - data.ebitdaTarget
  const marginGapPct = data.netMarginPct - data.netMarginTarget
  // Real values from the Excel Comparison-to-PP and AR Aging sheets; null
  // only if the source workbook is missing that data for this quarter.
  const arrYoYChange = data.arrYoYChangePct
  const ruleOf40 = data.ruleOf40
  const arAging = data.arAgingOver90
  const atRisk = data.arrAtRisk
  const atRiskRange =
    atRisk && atRisk.quarters.length > 0
      ? `${atRisk.quarters[0]} to ${atRisk.quarters[atRisk.quarters.length - 1]}`
      : ''
  const hcChange =
    data.headcountPriorQuarter !== null ? data.headcount - data.headcountPriorQuarter : null

  const items: KpiItem[] = [
    {
      label: 'Total revenue (quarter)',
      value: `$${(data.totalRevenue / 1e6).toFixed(1)}M`,
      context: `${rrPercentage.toFixed(0)}% recurring`,
    },
    {
      label: 'EBITDA',
      value: `$${(data.ebitda / 1e6).toFixed(1)}M`,
      context: `${data.netMarginPct.toFixed(1)}% margin`,
    },
    {
      label: 'Net margin',
      value: `${data.netMarginPct.toFixed(1)}%`,
      context:
        marginGap < 0
          ? `-$${Math.abs(marginGap / 1e3).toFixed(0)}K, ${Math.abs(marginGapPct).toFixed(1)} pts below ${data.netMarginTarget.toFixed(1)}% target`
          : `At or above ${data.netMarginTarget.toFixed(1)}% target`,
      tone: marginGap < 0 ? 'warning' : 'success',
    },
    {
      label: 'ARR (annualized)',
      value: `$${(arr / 1e6).toFixed(1)}M`,
      context:
        arrYoYChange !== null
          ? `${arrYoYChange < 0 ? 'Down' : 'Up'} ${Math.abs(arrYoYChange).toFixed(1)}% YoY`
          : 'YoY change unavailable',
      tone: arrYoYChange !== null && arrYoYChange < 0 ? 'critical' : 'default',
    },
    {
      label: 'Rule of 40',
      value: ruleOf40 !== null ? `${ruleOf40.toFixed(1)}%` : 'N/A',
      context: ruleOf40 === null ? 'Data unavailable' : ruleOf40 >= 40 ? 'Passing' : 'Failing',
      tone: ruleOf40 === null ? 'default' : ruleOf40 >= 40 ? 'success' : 'critical',
    },
    {
      label: 'AR > 90 days',
      value: arAging !== null ? `$${(arAging / 1e6).toFixed(1)}M` : 'N/A',
      context:
        arAging !== null ? (
          <>
            {((arAging / arr) * 100).toFixed(1)}% of ARR. <KpiLink href="/revenue-risk">Receivables</KpiLink>
          </>
        ) : (
          'Data unavailable'
        ),
      tone: arAging !== null ? 'critical' : 'default',
    },
    {
      label: 'ARR at risk (next 4 quarters)',
      value: atRisk ? `$${(atRisk.arr / 1e6).toFixed(1)}M` : 'N/A',
      context: atRisk ? (
        <>
          {atRisk.subscriptions} subscriptions not renewing, {atRiskRange}.{' '}
          <KpiLink href="/revenue-risk">Renewals</KpiLink>
        </>
      ) : (
        'Renewal tracker unavailable'
      ),
      tone: atRisk && atRisk.arr > 0 ? 'critical' : 'default',
    },
    {
      label: 'Headcount',
      value: data.headcountCost !== null ? data.headcount : 'N/A',
      context:
        data.headcountCost !== null ? (
          <>
            ${(data.headcountCost / 1e6).toFixed(2)}M cost this quarter
            {hcChange !== null && hcChange !== 0
              ? `, ${hcChange < 0 ? 'down' : 'up'} ${Math.abs(hcChange)} from last quarter`
              : ''}
            . <KpiLink href="/costs">Costs</KpiLink>
          </>
        ) : (
          'Headcount data unavailable'
        ),
    },
  ]

  return (
    <div>
      <KpiStrip items={items} />
      {(arrYoYChange === null || ruleOf40 === null || arAging === null) && (
        <p className="m-0 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          One or more of ARR YoY change, Rule of 40 and AR &gt; 90 days could not be computed from
          the current workbook, so they are shown as unavailable rather than estimated.
        </p>
      )}
    </div>
  )
}

function KpiLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium hover:underline" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
      {children}
    </Link>
  )
}

export function HeadlineKpisSkeleton() {
  return <div className="skeleton h-[78px]" aria-hidden="true" />
}
