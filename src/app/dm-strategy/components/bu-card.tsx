'use client';

import React from 'react';
import type { BusinessUnitMetrics } from '../types';
import '../styles.css';

interface BUCardProps {
  metrics: BusinessUnitMetrics;
  isActive?: boolean;
  onClick?: (bu: string) => void;
}

export default function BUCard({ metrics, isActive = false, onClick }: BUCardProps) {
  const percentage = (metrics.currentDM / metrics.targetDM) * 100;
  const isOnTarget = metrics.currentDM >= metrics.targetDM;

  // SVG Donut Chart
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const trendIcon = metrics.trend === 'up' ? '↑' : metrics.trend === 'down' ? '↓' : '→';
  const trendColor = metrics.trend === 'up' ? 'var(--success)' : metrics.trend === 'down' ? 'var(--critical)' : 'var(--text-light)';

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
        background: isActive ? 'rgba(0, 184, 212, 0.05)' : 'var(--white)',
        transform: isActive ? 'translateX(4px)' : 'none',
        transition: 'all 0.2s ease'
      }}
      onClick={() => onClick?.(metrics.name)}
    >
      {/* BU Name */}
      <div className="dm-flex dm-justify-between dm-items-center dm-mb-md">
        <h3 className="dm-h4" style={{ margin: 0, color: metrics.color }}>
          {metrics.name}
        </h3>
        {metrics.recommendationCount > 0 && (
          <span
            className="dm-badge"
            style={{
              background: 'var(--critical)',
              color: 'var(--white)',
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

      {/* DM% Donut Chart */}
      <div className="dm-flex dm-justify-center dm-items-center" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
            />
            {/* Progress Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={metrics.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          {/* Center Text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: metrics.color }}>
              {metrics.currentDM.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              Target: {metrics.targetDM.toFixed(1)}%
            </div>
          </div>
        </div>
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
