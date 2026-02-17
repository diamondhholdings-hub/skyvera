'use client';

import React from 'react';
import Link from 'next/link';
import type { Recommendation } from '@/app/dm-strategy/types';
import '@/app/dm-strategy/styles.css';

interface DMBriefingWidgetProps {
  recommendations: Recommendation[];
  maxItems?: number;
}

export default function DMBriefingWidget({ recommendations, maxItems = 5 }: DMBriefingWidgetProps) {
  // Get urgent recommendations (critical and high priority)
  const urgentRecommendations = recommendations
    .filter(r => r.status === 'pending' && (r.priority === 'critical' || r.priority === 'high'))
    .sort((a, b) => {
      // Sort by priority first (critical > high)
      if (a.priority === 'critical' && b.priority !== 'critical') return -1;
      if (b.priority === 'critical' && a.priority !== 'critical') return 1;
      // Then by ARR impact
      return b.arrImpact - a.arrImpact;
    })
    .slice(0, maxItems);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'var(--critical)';
      case 'high':
        return 'var(--warning)';
      default:
        return 'var(--text-light)';
    }
  };

  return (
    <div
      className="dm-card"
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--primary-blue)',
          color: 'var(--white)',
          padding: 'var(--space-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 className="dm-h4" style={{ margin: 0, color: 'var(--white)' }}>
          💡 Revenue Retention Briefing
        </h3>
        <Link
          href="/dm-strategy"
          style={{
            fontSize: '0.875rem',
            color: 'var(--accent-cyan)',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}
        >
          View All →
        </Link>
      </div>

      {/* Recommendations List */}
      <div style={{ padding: 'var(--space-lg)' }}>
        {urgentRecommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-light)' }}>
            <p className="dm-body">No urgent recommendations at this time.</p>
            <p className="dm-caption" style={{ marginTop: 'var(--space-xs)' }}>
              All accounts are on track with retention targets.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {urgentRecommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--background)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `4px solid ${getPriorityColor(rec.priority)}`,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Priority & Account */}
                <div className="dm-flex dm-items-center dm-gap-sm dm-mb-xs">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getPriorityColor(rec.priority)
                    }}
                  />
                  <span className="dm-body-sm" style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                    {rec.accountName}
                  </span>
                  <span
                    className="dm-badge"
                    style={{
                      background: 'rgba(0, 184, 212, 0.1)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.625rem',
                      padding: '2px 6px'
                    }}
                  >
                    {rec.businessUnit}
                  </span>
                </div>

                {/* Title (truncated) */}
                <p
                  className="dm-body-sm dm-truncate"
                  style={{
                    color: 'var(--text-dark)',
                    marginBottom: 'var(--space-sm)',
                    maxWidth: '100%'
                  }}
                >
                  {rec.title}
                </p>

                {/* Impact & Actions */}
                <div className="dm-flex dm-justify-between dm-items-center">
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: rec.arrImpact > 0 ? 'var(--success)' : 'var(--text-light)'
                    }}
                  >
                    {formatCurrency(rec.arrImpact)} ARR
                  </span>
                  <div className="dm-flex dm-gap-xs">
                    <button
                      className="dm-btn dm-btn-primary dm-btn-sm"
                      onClick={() => {
                        // TODO: Implement accept recommendation functionality
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      Accept
                    </button>
                    <Link href={`/dm-strategy?rec=${rec.id}`}>
                      <button
                        className="dm-btn dm-btn-secondary dm-btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {urgentRecommendations.length > 0 && (
          <div
            style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'rgba(0, 184, 212, 0.05)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(0, 184, 212, 0.2)'
            }}
          >
            <div className="dm-flex dm-justify-between dm-items-center">
              <span className="dm-body-sm" style={{ color: 'var(--text-light)' }}>
                Total Potential Impact
              </span>
              <span
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)'
                }}
              >
                {formatCurrency(
                  urgentRecommendations.reduce((sum, r) => sum + r.arrImpact, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
