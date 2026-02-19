'use client';

import React from 'react';
import type { Recommendation } from '../types';
import '../styles.css';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: (id: string) => void;
  onReview?: (id: string) => void;
  onDefer?: (id: string) => void;
}

const DESIGN_TOKENS = {
  success: '#4caf50',
  critical: '#e53935',
  warning: '#f59e0b',
  secondary: '#2d4263',
  accent: '#c84b31',
  muted: '#8b8b8b',
  border: '#e8e6e1',
  ink: '#1a1a1a',
}

const priorityConfig = {
  critical: {
    color: DESIGN_TOKENS.critical,
    label: 'Critical',
    icon: '🔴'
  },
  high: {
    color: DESIGN_TOKENS.warning,
    label: 'High',
    icon: '🟠'
  },
  medium: {
    color: DESIGN_TOKENS.success,
    label: 'Medium',
    icon: '🟢'
  },
  low: {
    color: DESIGN_TOKENS.muted,
    label: 'Low',
    icon: '⚪'
  }
};

const buConfig = {
  Cloudsense: DESIGN_TOKENS.secondary,
  Kandy: DESIGN_TOKENS.accent,
  STL: DESIGN_TOKENS.success
};

export default function RecommendationCard({
  recommendation,
  onAccept,
  onReview,
  onDefer
}: RecommendationCardProps) {
  const priorityInfo = priorityConfig[recommendation.priority];
  const buColor = buConfig[recommendation.businessUnit];

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
    <div
      className="dm-card card-hover animate-fade-in-up"
      style={{
        borderLeft: `4px solid ${priorityInfo.color}`,
        position: 'relative'
      }}
    >
      {/* Priority Badge */}
      <div className="dm-flex dm-justify-between dm-items-start dm-mb-md">
        <span
          className="dm-priority-badge"
          style={{
            background: priorityInfo.color,
            color: '#FFFFFF'
          }}
        >
          {priorityInfo.icon} {priorityInfo.label}
        </span>
      </div>

      {/* Account & BU */}
      <div className="dm-flex dm-items-center dm-gap-sm dm-mb-sm">
        <span className="dm-h4" style={{ margin: 0 }}>
          {recommendation.accountName}
        </span>
        <span
          className="dm-badge"
          style={{
            background: `${buColor}15`,
            color: buColor,
            fontWeight: 600
          }}
        >
          {recommendation.businessUnit}
        </span>
      </div>

      {/* Recommendation Title */}
      <h3 className="dm-h3" style={{ marginTop: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        {recommendation.title}
      </h3>

      {/* Description */}
      <p className="dm-body-sm" style={{ color: 'var(--muted)', marginBottom: 'var(--space-lg)' }}>
        {recommendation.description}
      </p>

      {/* Impact Metrics */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="dm-metric-row">
          <span className="dm-metric-label">DM% Impact</span>
          <span
            className="dm-metric-value"
            style={{
              color: recommendation.dmImpact > 0 ? 'var(--success)' : 'var(--critical)',
              fontWeight: 700
            }}
          >
            {formatPercentage(recommendation.dmImpact)}
          </span>
        </div>
        <div className="dm-metric-row">
          <span className="dm-metric-label">ARR Impact</span>
          <span
            className="dm-metric-value"
            style={{
              color: recommendation.arrImpact > 0 ? 'var(--success)' : 'var(--critical)',
              fontWeight: 700
            }}
          >
            {formatCurrency(recommendation.arrImpact)}
          </span>
        </div>
        <div className="dm-metric-row">
          <span className="dm-metric-label">Confidence</span>
          <span className="dm-metric-value">
            {recommendation.confidence}%
          </span>
        </div>
      </div>

      {/* Metadata Tags */}
      <div className="dm-flex dm-flex-wrap dm-gap-sm dm-mb-lg">
        {recommendation.owner && (
          <span className="dm-tag">
            👤 {recommendation.owner}
          </span>
        )}
        <span className="dm-tag">
          📅 {recommendation.timeline}
        </span>
        <span className="dm-tag">
          ⚠️ {recommendation.risk} Risk
        </span>
        {recommendation.category && (
          <span className="dm-tag">
            🏷️ {recommendation.category}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="dm-flex dm-gap-sm dm-flex-wrap">
        {onAccept && (
          <button
            className="dm-btn dm-btn-primary dm-btn-md button-press"
            onClick={() => onAccept(recommendation.id)}
            style={{ flex: '1 1 auto' }}
          >
            ✓ Accept & Create Action
          </button>
        )}
        {onReview && (
          <button
            className="dm-btn dm-btn-secondary dm-btn-md button-press"
            onClick={() => onReview(recommendation.id)}
            style={{ flex: '1 1 auto' }}
          >
            👁️ Review Details
          </button>
        )}
        {onDefer && (
          <button
            className="dm-btn dm-btn-tertiary dm-btn-md button-press"
            onClick={() => onDefer(recommendation.id)}
          >
            ⏸️ Defer
          </button>
        )}
      </div>

      {/* Status Indicator (if not pending) */}
      {recommendation.status !== 'pending' && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            right: 'var(--space-md)',
            padding: '4px 8px',
            background: 'var(--paper)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--muted)',
            textTransform: 'uppercase'
          }}
        >
          {recommendation.status}
        </div>
      )}
    </div>
  );
}
