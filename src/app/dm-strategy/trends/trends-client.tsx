'use client';

import React from 'react';
import Link from 'next/link';
import DMTrendChart from '../components/dm-trend-chart';
import type { BusinessUnitMetrics, MonthlyDMData } from '../types';
import '../styles.css';

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
    const trend = delta > 1 ? 'improving' : delta < -1 ? 'declining' : 'stable';
    const onTarget = last.dmPercent >= bu.targetDM;
    return { bu, first, last, delta, trend, onTarget };
  }).filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: 'var(--space-xl)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: 'var(--space-sm)' }}>
            DM% Retention Trends
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--muted)', marginBottom: 'var(--space-md)' }}>
            12-month trailing analysis showing revenue retention patterns across {businessUnits.length} business units
          </p>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            <Link href="/dm-strategy" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>DM Strategy</Link>
            {' / '}
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Trends</span>
          </div>
        </div>

        {/* Portfolio-Wide Chart */}
        {portfolioHistory.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            marginBottom: 'var(--space-2xl)',
            boxShadow: '0 4px 16px rgba(45, 66, 99, 0.2)',
          }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
              <DMTrendChart
                data={portfolioHistory}
                title={`Portfolio-Wide DM% Trend (${businessUnits.length} Business Units)`}
                color="var(--secondary)"
                targetDM={95.0}
                showTarget={true}
              />
            </div>
          </div>
        )}

        {/* Per-BU Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
          gap: 'var(--space-xl)',
          marginBottom: 'var(--space-2xl)',
        }}>
          {businessUnits.map((bu) => (
            <DMTrendChart
              key={bu.name}
              data={bu.history || []}
              title={`${bu.name} — DM% Trend`}
              color={bu.color}
              targetDM={bu.targetDM}
              showTarget={true}
            />
          ))}
        </div>

        {/* Key Insights — generated from real data */}
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--space-lg)' }}>
            Key Insights
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {insights.map((insight) => {
              if (!insight) return null;
              const { bu, first, last, delta, trend, onTarget } = insight;
              const borderColor = trend === 'improving' ? 'var(--success)' : trend === 'declining' ? 'var(--critical)' : 'var(--warning)';
              const trendLabel = trend === 'improving'
                ? `Strong improvement (+${delta.toFixed(1)}pp)`
                : trend === 'declining'
                ? `Declining trend (${delta.toFixed(1)}pp)`
                : 'Relatively stable';
              return (
                <div key={bu.name} style={{ padding: 'var(--space-md)', borderLeft: `4px solid ${borderColor}`, background: 'var(--highlight)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    {bu.name}: {trendLabel} ({first.dmPercent.toFixed(1)}% → {last.dmPercent.toFixed(1)}%)
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                    {onTarget
                      ? `Currently above ${bu.targetDM}% target. `
                      : `Currently ${(last.dmPercent - bu.targetDM).toFixed(1)}pp below ${bu.targetDM}% target. `}
                    TTM DM%: <strong style={{ color: bu.color }}>{bu.ttmDM.toFixed(1)}%</strong>
                    {' · '}ARR: <strong>${(bu.arr / 1000000).toFixed(1)}M</strong>
                    {' · '}Scenario <strong>{bu.scenario}</strong>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
