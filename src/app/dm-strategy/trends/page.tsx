'use client';

import React from 'react';
import DMTrendChart from '../components/dm-trend-chart';
import type { BusinessUnitMetrics, MonthlyDMData } from '../types';
import { sampleBusinessUnits } from '../demo/demo-data';
import '../styles.css';

/**
 * DM% Trends Page
 * Visual trend analysis with 12-month charts for each BU and portfolio-wide
 */

export default function DMTrendsPage() {
  // Calculate portfolio-wide trend (weighted average by revenue)
  const portfolioHistory: MonthlyDMData[] = [];

  // Assuming all BUs have same months
  const cloudsense = sampleBusinessUnits.find(bu => bu.name === 'Cloudsense');
  const kandy = sampleBusinessUnits.find(bu => bu.name === 'Kandy');
  const stl = sampleBusinessUnits.find(bu => bu.name === 'STL');

  if (cloudsense?.history && kandy?.history && stl?.history) {
    for (let i = 0; i < cloudsense.history.length; i++) {
      const totalRevenue =
        cloudsense.history[i].revenue +
        kandy.history[i].revenue +
        stl.history[i].revenue;

      const weightedDM =
        (cloudsense.history[i].dmPercent * cloudsense.history[i].revenue +
          kandy.history[i].dmPercent * kandy.history[i].revenue +
          stl.history[i].dmPercent * stl.history[i].revenue) /
        totalRevenue;

      portfolioHistory.push({
        month: cloudsense.history[i].month,
        dmPercent: weightedDM,
        revenue: totalRevenue,
        targetDM: 95.0,
      });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: 'var(--space-xl)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#0066A1',
              marginBottom: 'var(--space-sm)',
            }}
          >
            DM% Retention Trends
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--text-light)',
              marginBottom: 'var(--space-md)',
            }}
          >
            12-month trailing analysis showing revenue retention patterns across all business units
          </p>

          {/* Navigation Breadcrumb */}
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            <a href="/dm-strategy" style={{ color: '#0066A1', textDecoration: 'none' }}>
              DM Strategy
            </a>
            {' / '}
            <a href="/dm-strategy/demo" style={{ color: '#0066A1', textDecoration: 'none' }}>
              Demo
            </a>
            {' / '}
            <span style={{ color: '#111827', fontWeight: 600 }}>Trends</span>
          </div>
        </div>

        {/* Portfolio-Wide Chart (Prominent) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0066A1 0%, #004d7a 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            marginBottom: 'var(--space-2xl)',
            boxShadow: '0 4px 16px rgba(0, 102, 161, 0.2)',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
            }}
          >
            <DMTrendChart
              data={portfolioHistory}
              title="🏢 Portfolio-Wide DM% Trend (All Business Units)"
              color="#0066A1"
              targetDM={95.0}
              showTarget={true}
            />
          </div>
        </div>

        {/* Business Unit Charts */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: 'var(--space-xl)',
          }}
        >
          {sampleBusinessUnits.map((bu) => (
            <DMTrendChart
              key={bu.name}
              data={bu.history || []}
              title={`${bu.name} - DM% Trend`}
              color={bu.color}
              targetDM={bu.targetDM}
              showTarget={true}
            />
          ))}
        </div>

        {/* Insights Summary */}
        <div
          style={{
            marginTop: 'var(--space-2xl)',
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: 'var(--space-lg)',
            }}
          >
            Key Insights
          </h2>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-lg)',
            }}
          >
            {/* Cloudsense Insight */}
            <div
              style={{
                padding: 'var(--space-md)',
                borderLeft: '4px solid #0066A1',
                background: '#F0F9FF',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
                📉 Cloudsense: Declining Trend (95.2% → 93.2%)
              </h3>
              <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
                Revenue retention has declined 2 percentage points over 12 months, falling below the
                95% target. January 2026 (93.2%) was the worst month in a year. Recommend urgent
                investigation into churn drivers and implementation of retention recommendations.
              </p>
            </div>

            {/* Kandy Insight */}
            <div
              style={{
                padding: 'var(--space-md)',
                borderLeft: '4px solid #00B8D4',
                background: '#F0FDFF',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
                📈 Kandy: Strong Improvement (96.5% → 98.5%)
              </h3>
              <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
                Consistently exceeding 95% target with steady improvement over 12 months (+2pp).
                January 2026 (98.5%) near peak performance. Document success factors for replication
                across other business units.
              </p>
            </div>

            {/* STL Insight */}
            <div
              style={{
                padding: 'var(--space-md)',
                borderLeft: '4px solid #27AE60',
                background: '#F0FDF4',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
                ⚠️ STL: Persistently Below Target (92-93% range)
              </h3>
              <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
                Consistently 2-3 percentage points below 95% target throughout the year. Flat trend
                indicates systemic retention challenges rather than temporary issues. Requires
                strategic intervention and dedicated retention program.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
