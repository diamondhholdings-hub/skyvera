'use client';

import React from 'react';
import type { ImpactProjection } from '../types';
import '../styles.css';

interface ImpactCalculatorProps {
  projection: ImpactProjection;
  onAcceptAll?: () => void;
}

export default function ImpactCalculator({ projection, onAcceptAll }: ImpactCalculatorProps) {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="dm-sticky-sidebar">
      <div className="dm-card" style={{ background: '#FFFFFF' }}>
        {/* Header */}
        <div className="dm-card-header">
          <h3 className="dm-h4" style={{ margin: 0 }}>
            📊 Projected Impact
          </h3>
          <p className="dm-caption" style={{ marginTop: 'var(--space-xs)', marginBottom: 0 }}>
            Based on {projection.acceptedRecommendations} of {projection.totalRecommendations} recommendations
          </p>
        </div>

        {/* Before/After Comparison - DM% */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="dm-body-sm" style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>
            DM% Rate
          </div>
          <div className="dm-flex dm-items-center dm-justify-center dm-gap-md">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 'var(--space-xs)' }}>
                Current
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--muted)' }}>
                {projection.currentDM.toFixed(1)}%
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--muted)' }}>
              →
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: 'var(--space-xs)' }}>
                Projected
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                {projection.projectedDM.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Delta Highlight Box - DM% */}
        <div
          className="dm-impact-highlight"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 184, 212, 0.1) 0%, rgba(0, 184, 212, 0.05) 100%)',
            borderLeft: '4px solid var(--accent)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
            {formatPercentage(projection.dmDelta)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 'var(--space-xs)' }}>
            DM% Improvement
          </div>
        </div>

        {/* Before/After Comparison - ARR */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="dm-body-sm" style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>
            Annual Recurring Revenue
          </div>
          <div className="dm-flex dm-items-center dm-justify-center dm-gap-md">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 'var(--space-xs)' }}>
                Current
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--muted)' }}>
                {formatCurrency(projection.currentARR)}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--muted)' }}>
              →
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: 'var(--space-xs)' }}>
                Projected
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                {formatCurrency(projection.projectedARR)}
              </div>
            </div>
          </div>
        </div>

        {/* Delta Highlight Box - ARR */}
        <div
          className="dm-impact-highlight"
          style={{
            background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(39, 174, 96, 0.05) 100%)',
            borderLeft: '4px solid var(--success)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>
            {formatCurrency(projection.arrDelta)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 'var(--space-xs)' }}>
            Additional ARR
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="dm-flex dm-justify-between dm-items-center dm-mb-xs">
            <span className="dm-caption">Implementation Progress</span>
            <span className="dm-caption" style={{ fontWeight: 600 }}>
              {projection.acceptedRecommendations}/{projection.totalRecommendations}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'var(--border)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${(projection.acceptedRecommendations / projection.totalRecommendations) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent) 0%, var(--secondary) 100%)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Accept All Button */}
        {onAcceptAll && projection.acceptedRecommendations < projection.totalRecommendations && (
          <button
            className="dm-btn dm-btn-primary dm-btn-lg"
            onClick={onAcceptAll}
            style={{ width: '100%' }}
          >
            ⚡ Accept All High Priority
          </button>
        )}

        {/* Summary Stats */}
        <div
          style={{
            marginTop: 'var(--space-lg)',
            padding: 'var(--space-md)',
            background: 'var(--paper)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div className="dm-caption" style={{ marginBottom: 'var(--space-sm)' }}>
            Key Metrics
          </div>
          <div className="dm-metric-row">
            <span className="dm-metric-label">DM% Lift</span>
            <span className="dm-metric-value" style={{ color: 'var(--accent)' }}>
              {projection.dmDelta.toFixed(1)} pts
            </span>
          </div>
          <div className="dm-metric-row">
            <span className="dm-metric-label">ARR Growth</span>
            <span className="dm-metric-value" style={{ color: 'var(--success)' }}>
              {((projection.arrDelta / projection.currentARR) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="dm-metric-row">
            <span className="dm-metric-label">Confidence</span>
            <span className="dm-metric-value">
              High
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
