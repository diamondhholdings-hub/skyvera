import React from 'react';
import Link from 'next/link';
import { LineChart } from 'lucide-react';
import type { DashboardStats } from '../types';
import { DM_SCENARIOS, DM_THRESHOLDS } from '@/lib/intelligence/dm-strategy/constants';
import { PageHeader } from '@/components/ui/page-header';
import { KpiStrip, type KpiItem } from '@/components/ui/kpi-strip';

interface DMStrategyHeroProps {
  stats: DashboardStats;
  /** Fiscal quarter of the DM tracker data, e.g. "Q4'26". Null when unknown. */
  quarter?: string | null;
  /** Subtitle under the page title (scope and source) */
  subtitle?: React.ReactNode;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

/** Tone + context for a DM% figure against its floor and target. Color is always backed by words. */
function dmStatus(value: number, floor: number, target: number, period: string): Pick<KpiItem, 'tone' | 'context'> {
  if (value < floor) {
    return { tone: 'critical', context: `Below ${floor}% ${period}floor · target ${target}%` };
  }
  if (value < target) {
    return { tone: 'warning', context: `Above ${floor}% floor · below ${target}% target` };
  }
  return { tone: 'success', context: `At or above ${target}% target` };
}

export default function DMStrategyHero({ stats, quarter, subtitle }: DMStrategyHeroProps) {
  const { floor: annualFloor, target: annualTarget } = DM_THRESHOLDS.annual;
  const { floor: qFloor, target: qTarget } = DM_THRESHOLDS.quarterly;

  const items: KpiItem[] = [
    {
      label: 'TTM DM%',
      value: `${stats.ttmDM.toFixed(1)}%`,
      ...dmStatus(stats.ttmDM, annualFloor, annualTarget, ''),
    },
    {
      label: 'DM% vs prior plan',
      value: `${stats.currentDM.toFixed(1)}%`,
      ...dmStatus(stats.currentDM, annualFloor, annualTarget, ''),
    },
    {
      label: quarter ? `${quarter} vs prior quarter` : 'Latest quarter vs prior',
      value: `${stats.quarterlyDM.toFixed(1)}%`,
      ...dmStatus(stats.quarterlyDM, qFloor, qTarget, 'quarterly '),
    },
    {
      label: 'Potential ARR recovery',
      value: formatCurrency(stats.potentialARR),
      context: 'From pending recommendations',
    },
    {
      label: 'Active recommendations',
      value: stats.activeRecommendations,
      context: 'Pending review',
    },
    {
      label: 'Accounts analyzed',
      value: stats.totalAccounts,
      context: 'In the business units tracked',
    },
    {
      label: 'Business units below floor',
      value: stats.atRiskAccounts,
      tone: stats.atRiskAccounts > 0 ? 'critical' : 'default',
      context: stats.atRiskAccounts > 0 ? `Below ${annualFloor}% TTM floor` : `All at or above ${annualFloor}% floor`,
    },
  ];

  const scenarioCounts = stats.scenarioBreakdown
    ? (Object.keys(DM_SCENARIOS) as Array<keyof typeof DM_SCENARIOS>)
        .map((key) => ({ key, label: DM_SCENARIOS[key].label, count: stats.scenarioBreakdown[key] ?? 0 }))
        .filter((s) => s.count > 0)
    : [];

  return (
    <PageHeader
      title="Revenue retention"
      subtitle={subtitle ?? 'DM% by business unit. Recommendations ranked by ARR impact and confidence.'}
      action={
        <Link href="/dm-strategy/trends" className="btn">
          <LineChart className="h-4 w-4" aria-hidden="true" />
          View trends
        </Link>
      }
    >
      <KpiStrip items={items} />
      {scenarioCounts.length > 0 && (
        <p className="m-0 mt-3 text-sm" style={{ color: 'var(--muted)' }}>
          Business units by scenario:{' '}
          {scenarioCounts.map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && ' · '}
              <span style={{ color: 'var(--ink-2)' }}>{s.label}</span>{' '}
              <span className="num" style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.count}</span>
            </React.Fragment>
          ))}
        </p>
      )}
    </PageHeader>
  );
}
