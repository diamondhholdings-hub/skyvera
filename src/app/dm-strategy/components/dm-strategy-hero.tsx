'use client';

import React from 'react';
import type { DashboardStats } from '../types';
import '../styles.css';

interface DMStrategyHeroProps {
  stats: DashboardStats;
}

export default function DMStrategyHero({ stats }: DMStrategyHeroProps) {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div
      className="dm-hero"
      style={{
        background: 'linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%)',
        color: '#FFFFFF',
        padding: 'var(--space-2xl) var(--space-lg)',
        textAlign: 'center',
        marginBottom: 'var(--space-lg)'
      }}
    >
      {/* Main Heading */}
      <h1
        className="dm-hero-title"
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: 'var(--space-md)',
          color: '#FFFFFF'
        }}
      >
        DM% Strategy & Revenue Retention
      </h1>

      {/* Subtitle */}
      <p
        className="dm-hero-subtitle"
        style={{
          fontSize: '1.125rem',
          opacity: 0.9,
          marginBottom: 'var(--space-xl)',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        AI-powered recommendations to optimize decline/maintenance rates,
        maximize recurring revenue, and strengthen customer retention across all business units.
      </p>

      {/* Stats Grid */}
      <div
        className="dm-hero-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-xl)'
        }}
      >
        {/* Monthly DM% */}
        <div
          className="dm-hero-stat"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div
            className="dm-hero-stat-value"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: 'var(--space-xs)',
              color: '#FFFFFF'
            }}
          >
            {stats.monthlyDM.toFixed(1)}%
          </div>
          <div
            className="dm-hero-stat-label"
            style={{
              fontSize: '0.75rem',
              opacity: 0.7
            }}
          >
            This Month (Jan)
          </div>
        </div>

        {/* Quarterly DM% */}
        <div
          className="dm-hero-stat"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div
            className="dm-hero-stat-value"
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: 'var(--space-xs)',
              color: '#FFFFFF'
            }}
          >
            {stats.quarterlyDM.toFixed(1)}%
          </div>
          <div
            className="dm-hero-stat-label"
            style={{
              fontSize: '0.75rem',
              opacity: 0.7
            }}
          >
            This Quarter (Q1'26)
          </div>
        </div>

        {/* TTM DM% - Primary */}
        <div
          className="dm-hero-stat"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 'var(--space-xs)',
              right: 'var(--space-xs)',
              background: 'rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Primary
          </div>
          <div
            className="dm-hero-stat-value"
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: 'var(--space-xs)',
              color: '#FFFFFF'
            }}
          >
            {stats.ttmDM.toFixed(1)}%
          </div>
          <div
            className="dm-hero-stat-label"
            style={{
              fontSize: '0.875rem',
              opacity: 0.9,
              fontWeight: 600
            }}
          >
            TTM (12 Months)
          </div>
        </div>

        {/* Potential ARR - Highlighted */}
        <div
          className="dm-hero-stat"
          style={{
            background: 'linear-gradient(135deg, rgba(200, 75, 49, 0.3) 0%, rgba(200, 75, 49, 0.15) 100%)',
            backdropFilter: 'blur(10px)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--accent)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 'var(--space-xs)',
              right: 'var(--space-xs)',
              background: 'var(--accent)',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            High Impact
          </div>
          <div
            className="dm-hero-stat-value"
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: 'var(--space-xs)',
              color: 'var(--accent)'
            }}
          >
            {formatCurrency(stats.potentialARR)}
          </div>
          <div
            className="dm-hero-stat-label"
            style={{
              fontSize: '0.875rem',
              opacity: 0.9,
              fontWeight: 600
            }}
          >
            Potential ARR Recovery
          </div>
        </div>

        {/* Active Recommendations */}
        <div
          className="dm-hero-stat"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div
            className="dm-hero-stat-value"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-xs)',
              color: '#FFFFFF'
            }}
          >
            {stats.activeRecommendations}
          </div>
          <div
            className="dm-hero-stat-label"
            style={{
              fontSize: '0.875rem',
              opacity: 0.8
            }}
          >
            Active Recommendations
          </div>
        </div>

        {/* Total Accounts */}
        <div
          className="dm-hero-stat"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div
            className="dm-hero-stat-value"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-xs)',
              color: '#FFFFFF'
            }}
          >
            {stats.totalAccounts}
          </div>
          <div
            className="dm-hero-stat-label"
            style={{
              fontSize: '0.875rem',
              opacity: 0.8
            }}
          >
            Accounts Analyzed
          </div>
        </div>

        {/* At-Risk Accounts */}
        {stats.atRiskAccounts > 0 && (
          <div
            className="dm-hero-stat"
            style={{
              background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.3) 0%, rgba(231, 76, 60, 0.15) 100%)',
              backdropFilter: 'blur(10px)',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--critical)'
            }}
          >
            <div
              className="dm-hero-stat-value"
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: 'var(--space-xs)',
                color: 'var(--critical)'
              }}
            >
              {stats.atRiskAccounts}
            </div>
            <div
              className="dm-hero-stat-label"
              style={{
                fontSize: '0.875rem',
                opacity: 0.9,
                fontWeight: 600
              }}
            >
              ⚠️ At-Risk Accounts
            </div>
          </div>
        )}
      </div>

      {/* Quick Action CTA */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: 'var(--space-sm)' }}>
          💡 Recommendations are prioritized by impact and confidence
        </p>
      </div>
    </div>
  );
}
