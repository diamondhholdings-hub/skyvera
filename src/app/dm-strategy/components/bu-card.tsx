'use client';

import React from 'react';
import type { BusinessUnitMetrics, DMThresholdViolation } from '../types';
import { DM_SCENARIOS } from '@/lib/intelligence/dm-strategy/constants';
import '../styles.css';

interface BUCardProps {
  metrics: BusinessUnitMetrics;
  isActive?: boolean;
  onClick?: (bu: string) => void;
}

function StatusDot({ violation }: { violation: DMThresholdViolation }) {
  if (violation.isRedFlag) return <span title={`${violation.value.toFixed(1)}% — red flag`} style={{ color: '#DC2626', fontSize: '0.7rem', fontWeight: 700 }}>✗</span>;
  if (violation.isViolation) return <span title={`${violation.value.toFixed(1)}% — below floor`} style={{ color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700 }}>⚠</span>;
  if (violation.value >= violation.target) return <span title={`${violation.value.toFixed(1)}% — on target`} style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>;
  return <span title={`${violation.value.toFixed(1)}% — above floor`} style={{ color: '#6366F1', fontSize: '0.7rem', fontWeight: 700 }}>~</span>;
}

export default function BUCard({ metrics, isActive = false, onClick }: BUCardProps) {
  const scenario = metrics.scenario ? DM_SCENARIOS[metrics.scenario] : null;
  const isOnTarget = metrics.ttmDM >= metrics.targetDM;

  const trendIcon = metrics.trend === 'up' ? '↑' : metrics.trend === 'down' ? '↓' : '→';
  const trendColor = metrics.trend === 'up' ? '#10B981' : metrics.trend === 'down' ? '#DC2626' : '#6B7280';

  const formatARR = (v: number) =>
    v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <div
      className="dm-card"
      style={{
        borderTop: `3px solid ${metrics.color}`,
        borderLeft: 'none',
        cursor: onClick ? 'pointer' : 'default',
        background: isActive ? `${metrics.color}08` : '#FFFFFF',
        outline: isActive ? `2px solid ${metrics.color}40` : 'none',
        transition: 'all 0.15s ease',
        padding: '12px 14px',
      }}
      onClick={() => onClick?.(metrics.name)}
    >
      {/* Row 1: Name + badge + rec count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: metrics.color }}>{metrics.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {scenario && (
            <span style={{
              background: `${scenario.color}18`,
              color: scenario.color,
              border: `1px solid ${scenario.color}50`,
              borderRadius: '3px',
              padding: '1px 5px',
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.3px',
            }}>
              {scenario.key}
            </span>
          )}
          {metrics.recommendationCount > 0 && (
            <span style={{
              background: '#DC2626',
              color: '#FFF',
              borderRadius: '10px',
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}>
              {metrics.recommendationCount}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: TTM DM% — big number */}
      <div style={{ textAlign: 'center', margin: '6px 0 8px' }}>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: isOnTarget ? '#10B981' : '#DC2626',
          lineHeight: 1,
        }}>
          {metrics.ttmDM.toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.6rem', color: '#6B7280', marginTop: '2px', fontWeight: 600 }}>TTM DM%</div>
      </div>

      {/* Row 3: M / Q / TTM threshold status pills */}
      {metrics.thresholdViolations?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
          {metrics.thresholdViolations.map((v) => (
            <div key={v.period} style={{
              textAlign: 'center',
              background: v.isRedFlag ? '#FEF2F2' : v.isViolation ? '#FFFBEB' : '#F0FDF4',
              borderRadius: '4px',
              padding: '3px 2px',
            }}>
              <StatusDot violation={v} />
              <div style={{ fontSize: '0.55rem', color: '#6B7280', fontWeight: 600, marginTop: '1px' }}>
                {v.period === 'annual' ? 'TTM' : v.period === 'monthly' ? 'Mo' : 'Qtr'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Row 4: ARR + trend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #F3F4F6',
        paddingTop: '6px',
        fontSize: '0.7rem',
      }}>
        <span style={{ color: '#6B7280', fontWeight: 600 }}>{formatARR(metrics.arr)}</span>
        <span style={{ color: trendColor, fontWeight: 700 }}>
          {trendIcon} {metrics.trendValue >= 0 ? '+' : ''}{metrics.trendValue.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
