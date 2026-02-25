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

function ThresholdStatusIcon({ violation }: { violation: DMThresholdViolation }) {
  if (violation.isRedFlag) return <span style={{ color: '#DC2626', fontWeight: 700 }}>✗</span>;
  if (violation.isViolation) return <span style={{ color: '#F59E0B', fontWeight: 700 }}>⚠</span>;
  if (violation.value >= violation.target) return <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>;
  return <span style={{ color: '#6366F1', fontWeight: 700 }}>~</span>; // above floor, below target
}

export default function BUCard({ metrics, isActive = false, onClick }: BUCardProps) {
  const percentage = (metrics.currentDM / metrics.targetDM) * 100;
  const isOnTarget = metrics.currentDM >= metrics.targetDM;

  const scenario = metrics.scenario ? DM_SCENARIOS[metrics.scenario] : null;

  // SVG Donut Chart
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const trendIcon = metrics.trend === 'up' ? '↑' : metrics.trend === 'down' ? '↓' : '→';
  const trendColor = metrics.trend === 'up' ? 'var(--success)' : metrics.trend === 'down' ? 'var(--critical)' : 'var(--muted)';

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div
      className="dm-card"
      style={{
        borderLeft: `4px solid ${metrics.color}`,
        cursor: onClick ? 'pointer' : 'default',
        background: isActive ? 'rgba(0, 184, 212, 0.05)' : '#FFFFFF',
        transform: isActive ? 'translateX(4px)' : 'none',
        transition: 'all 0.2s ease'
      }}
      onClick={() => onClick?.(metrics.name)}
    >
      {/* BU Name + Scenario Badge */}
      <div className="dm-flex dm-justify-between dm-items-center dm-mb-md">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className="dm-h4" style={{ margin: 0, color: metrics.color }}>
            {metrics.name}
          </h3>
          {scenario && (
            <span style={{
              background: `${scenario.color}20`,
              color: scenario.color,
              border: `1px solid ${scenario.color}60`,
              borderRadius: '4px',
              padding: '2px 7px',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {scenario.key} · {scenario.label}
            </span>
          )}
        </div>
        {metrics.recommendationCount > 0 && (
          <span
            className="dm-badge"
            style={{
              background: 'var(--critical)',
              color: '#FFFFFF',
              fontWeight: 700,
              minWidth: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 8px'
            }}
          >
            {metrics.recommendationCount}
          </span>
        )}
      </div>

      {/* DM% Three Periods */}
      <div style={{
        background: 'var(--paper)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{
          display: 'grid',
          gap: 'var(--space-sm)'
        }}>
          {/* Monthly DM% */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 'var(--space-xs)',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              fontWeight: 600
            }}>
              This Month (Jan)
            </span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: metrics.monthlyDM >= metrics.targetDM ? 'var(--success)' : 'var(--critical)'
            }}>
              {metrics.monthlyDM.toFixed(1)}%
            </span>
          </div>

          {/* Quarterly DM% */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 'var(--space-xs)',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              fontWeight: 600
            }}>
              This Quarter (Q1)
            </span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: metrics.quarterlyDM >= metrics.targetDM ? 'var(--success)' : 'var(--critical)'
            }}>
              {metrics.quarterlyDM.toFixed(1)}%
            </span>
          </div>

          {/* TTM DM% - Primary */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `${metrics.color}10`,
            padding: 'var(--space-xs)',
            borderRadius: 'var(--radius-sm)',
            marginTop: 'var(--space-xs)'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: metrics.color,
              fontWeight: 700
            }}>
              TTM (12 Mo.)
            </span>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: metrics.color
            }}>
              {metrics.ttmDM.toFixed(1)}%
            </span>
          </div>

          {/* Target Reference */}
          <div style={{
            textAlign: 'center',
            fontSize: '0.7rem',
            color: 'var(--muted)',
            marginTop: 'var(--space-xs)'
          }}>
            Target: {metrics.targetDM.toFixed(1)}%
          </div>
        </div>

        {/* Threshold Status — Monthly / Quarterly / Annual */}
        {metrics.thresholdViolations && metrics.thresholdViolations.length > 0 && (
          <div style={{
            marginTop: 'var(--space-sm)',
            paddingTop: 'var(--space-sm)',
            borderTop: '1px dashed var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '4px'
          }}>
            {metrics.thresholdViolations.map((v) => (
              <div key={v.period} style={{
                textAlign: 'center',
                background: v.isRedFlag ? '#FEF2F2' : v.isViolation ? '#FFFBEB' : '#F0FDF4',
                borderRadius: '4px',
                padding: '4px 2px'
              }}>
                <div style={{ fontSize: '0.9rem', lineHeight: 1 }}>
                  <ThresholdStatusIcon violation={v} />
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: '2px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {v.period === 'annual' ? 'TTM' : v.period}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: v.isViolation ? '#B45309' : '#065F46' }}>
                  {v.value.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trend Indicator */}
      <div className="dm-flex dm-justify-center dm-items-center dm-gap-xs dm-mb-md">
        <span
          style={{
            fontSize: '1.25rem',
            color: trendColor
          }}
        >
          {trendIcon}
        </span>
        <span
          className="dm-body-sm"
          style={{
            fontWeight: 600,
            color: trendColor
          }}
        >
          {metrics.trendValue >= 0 ? '+' : ''}{metrics.trendValue.toFixed(1)}% vs Last Quarter
        </span>
      </div>

      {/* Key Metrics */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)' }}>
        <div className="dm-metric-row">
          <span className="dm-metric-label">ARR</span>
          <span className="dm-metric-value">{formatCurrency(metrics.arr)}</span>
        </div>
        <div className="dm-metric-row">
          <span className="dm-metric-label">Accounts</span>
          <span className="dm-metric-value">{metrics.accountCount}</span>
        </div>
        <div className="dm-metric-row">
          <span className="dm-metric-label">Status</span>
          <span
            className="dm-metric-value"
            style={{
              color: isOnTarget ? 'var(--success)' : 'var(--critical)'
            }}
          >
            {isOnTarget ? '✓ On Target' : '⚠️ Below Target'}
          </span>
        </div>
      </div>
    </div>
  );
}
