'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ImpactProjection } from '../types';

interface ImpactCalculatorProps {
  projection: ImpactProjection;
  onAcceptAll?: () => void;
}

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

function BeforeAfter({ label, current, projected, delta }: { label: string; current: string; projected: string; delta: string }) {
  return (
    <div className="border-t py-4" style={{ borderColor: 'var(--border)' }}>
      <p className="m-0 text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="num text-sm" style={{ color: 'var(--muted)' }}>{current}</span>
        <ArrowRight className="h-3.5 w-3.5 self-center" style={{ color: 'var(--muted)' }} aria-label="to" />
        <span className="num text-xl font-semibold" style={{ color: 'var(--ink)' }}>{projected}</span>
        <span className="num text-sm font-medium" style={{ color: 'var(--ink-2)' }}>{delta}</span>
      </div>
    </div>
  );
}

export default function ImpactCalculator({ projection, onAcceptAll }: ImpactCalculatorProps) {
  const progressPct = projection.totalRecommendations > 0
    ? (projection.acceptedRecommendations / projection.totalRecommendations) * 100
    : 0;

  return (
    <section className="card p-5" aria-labelledby="impact-heading">
      <h2 id="impact-heading" className="m-0 text-base font-semibold">Projected impact</h2>
      <p className="m-0 mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
        Based on <span className="num">{projection.acceptedRecommendations}</span> of{' '}
        <span className="num">{projection.totalRecommendations}</span> recommendations accepted
      </p>

      <div className="mt-4">
        <BeforeAfter
          label="DM% rate"
          current={`${projection.currentDM.toFixed(1)}%`}
          projected={`${projection.projectedDM.toFixed(1)}%`}
          delta={formatPercentage(projection.dmDelta)}
        />
        <BeforeAfter
          label="Annual recurring revenue"
          current={formatCurrency(projection.currentARR)}
          projected={formatCurrency(projection.projectedARR)}
          delta={`+${formatCurrency(projection.arrDelta)}`}
        />
      </div>

      {/* Progress */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
          <span id="impact-progress-label">Implementation progress</span>
          <span className="num font-medium" style={{ color: 'var(--ink)' }}>
            {projection.acceptedRecommendations}/{projection.totalRecommendations}
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden"
          style={{ background: 'var(--surface-3)', borderRadius: 'var(--radius-xs)' }}
          role="progressbar"
          aria-labelledby="impact-progress-label"
          aria-valuemin={0}
          aria-valuemax={projection.totalRecommendations}
          aria-valuenow={projection.acceptedRecommendations}
        >
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--secondary)' }} />
        </div>
      </div>

      {/* Key metrics */}
      <dl className="m-0 mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt style={{ color: 'var(--muted)' }}>DM% lift</dt>
          <dd className="num m-0 font-medium" style={{ color: 'var(--ink)' }}>{projection.dmDelta.toFixed(1)} pts</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt style={{ color: 'var(--muted)' }}>ARR growth</dt>
          <dd className="num m-0 font-medium" style={{ color: 'var(--ink)' }}>
            {((projection.arrDelta / projection.currentARR) * 100).toFixed(1)}%
          </dd>
        </div>
      </dl>

      {/* Accept all */}
      {onAcceptAll && projection.acceptedRecommendations < projection.totalRecommendations && (
        <button type="button" className="btn mt-4 w-full" onClick={onAcceptAll}>
          Accept all high priority
        </button>
      )}
    </section>
  );
}
