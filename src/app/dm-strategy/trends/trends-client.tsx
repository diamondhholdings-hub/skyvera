'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import DMTrendChart from '../components/dm-trend-chart';
import type { BusinessUnitMetrics, MonthlyDMData } from '../types';

interface DMTrendsClientProps {
  businessUnits: BusinessUnitMetrics[];
}

export default function DMTrendsClient({ businessUnits }: DMTrendsClientProps) {
  // Build portfolio-wide weighted-average history across all BUs that have history
  const busWithHistory = businessUnits.filter(bu => bu.history && bu.history.length > 0);

  const portfolioHistory: MonthlyDMData[] = [];
  if (busWithHistory.length > 0) {
    const monthCount = busWithHistory[0].history!.length;
    for (let i = 0; i < monthCount; i++) {
      let totalRevenue = 0;
      let weightedDM = 0;
      for (const bu of busWithHistory) {
        const point = bu.history![i];
        if (point) {
          totalRevenue += point.revenue;
          weightedDM += point.dmPercent * point.revenue;
        }
      }
      if (totalRevenue > 0) {
        portfolioHistory.push({
          month: busWithHistory[0].history![i].month,
          dmPercent: weightedDM / totalRevenue,
          revenue: totalRevenue,
          targetDM: 95.0,
        });
      }
    }
  }

  // Generate key insights from actual data
  const insights = businessUnits.map(bu => {
    if (!bu.history || bu.history.length < 2) return null;
    const first = bu.history[0];
    const last = bu.history[bu.history.length - 1];
    const delta = last.dmPercent - first.dmPercent;
    const trend: 'improving' | 'declining' | 'stable' = delta > 1 ? 'improving' : delta < -1 ? 'declining' : 'stable';
    const onTarget = last.dmPercent >= bu.targetDM;
    return { bu, first, last, delta, trend, onTarget };
  }).filter(Boolean);

  const trendMeta = {
    improving: { Icon: ArrowUpRight, word: 'Improving', color: 'var(--success-ink)' },
    declining: { Icon: ArrowDownRight, word: 'Declining', color: 'var(--critical-ink)' },
    stable: { Icon: ArrowRight, word: 'Stable', color: 'var(--ink-2)' },
  } as const;

  return (
    <div>
      <PageHeader
        title="Retention trends"
        subtitle={`DM% by month for ${businessUnits.length} business units. Monthly points are interpolated from quarterly tracker data.`}
        action={
          <Link href="/dm-strategy" className="btn">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Revenue retention
          </Link>
        }
      />

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
        {/* Portfolio-wide chart */}
        {portfolioHistory.length > 0 && (
          <DMTrendChart
            data={portfolioHistory}
            title={`Portfolio DM%, revenue-weighted across ${busWithHistory.length} business units`}
            color="var(--secondary)"
            targetDM={95.0}
            showTarget={true}
          />
        )}

        {/* Per-BU charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {businessUnits.map((bu) => (
            <DMTrendChart
              key={bu.name}
              data={bu.history || []}
              title={bu.name}
              color="var(--secondary)"
              targetDM={bu.targetDM}
              showTarget={true}
            />
          ))}
        </div>

        {/* Key insights, generated from the data */}
        {insights.length > 0 && (
          <section className="card overflow-hidden" aria-labelledby="insights-heading">
            <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
              <h2 id="insights-heading" className="m-0 text-base font-semibold">Key insights</h2>
            </div>
            <ul className="m-0 list-none p-0">
              {insights.map((insight) => {
                if (!insight) return null;
                const { bu, first, last, delta, trend, onTarget } = insight;
                const meta = trendMeta[trend];
                const trendLabel = trend === 'improving'
                  ? `+${delta.toFixed(1)} pts`
                  : trend === 'declining'
                  ? `${delta.toFixed(1)} pts`
                  : 'within 1 pt';
                return (
                  <li key={bu.name} className="flex items-start gap-3 border-b px-5 py-3 last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                    <span className="inline-flex w-28 shrink-0 items-center gap-1.5 text-sm font-medium" style={{ color: meta.color }}>
                      <meta.Icon className="h-4 w-4" aria-hidden="true" />
                      {meta.word}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {bu.name}: <span className="num">{first.dmPercent.toFixed(1)}%</span> to{' '}
                        <span className="num">{last.dmPercent.toFixed(1)}%</span>{' '}
                        <span className="num" style={{ color: 'var(--muted)', fontWeight: 400 }}>({trendLabel})</span>
                      </p>
                      <p className="m-0 mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
                        {onTarget
                          ? `At or above ${bu.targetDM}% target. `
                          : `${(bu.targetDM - last.dmPercent).toFixed(1)} pts below ${bu.targetDM}% target. `}
                        TTM DM% <span className="num" style={{ color: 'var(--ink)' }}>{bu.ttmDM.toFixed(1)}%</span>
                        {' · '}ARR <span className="num" style={{ color: 'var(--ink)' }}>${(bu.arr / 1000000).toFixed(1)}M</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
