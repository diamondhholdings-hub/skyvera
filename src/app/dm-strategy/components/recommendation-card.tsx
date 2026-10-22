'use client';

import React from 'react';
import { Check, CircleX, Eye, Minus, Pause, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept?: (id: string) => void;
  onReview?: (id: string) => void;
  onDefer?: (id: string) => void;
}

const priorityConfig: Record<Recommendation['priority'], { label: string; Icon: LucideIcon; color: string }> = {
  critical: { label: 'Critical', Icon: CircleX, color: 'var(--critical-ink)' },
  high: { label: 'High', Icon: TriangleAlert, color: 'var(--warning-ink)' },
  medium: { label: 'Medium', Icon: Minus, color: 'var(--ink-2)' },
  low: { label: 'Low', Icon: Minus, color: 'var(--muted)' },
};

const statusLabel: Record<Recommendation['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  deferred: 'Deferred',
  in_progress: 'In progress',
  completed: 'Completed',
};

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

export default function RecommendationCard({
  recommendation,
  onAccept,
  onReview,
  onDefer
}: RecommendationCardProps) {
  const priority = priorityConfig[recommendation.priority];

  const facts: Array<{ label: string; value: React.ReactNode; num?: boolean }> = [
    { label: 'DM% impact', value: formatPercentage(recommendation.dmImpact), num: true },
    { label: 'ARR impact', value: formatCurrency(recommendation.arrImpact), num: true },
    { label: 'Confidence', value: `${recommendation.confidence}%`, num: true },
    { label: 'Timeline', value: recommendation.timeline },
    { label: 'Risk', value: recommendation.risk },
    ...(recommendation.owner ? [{ label: 'Owner', value: recommendation.owner }] : []),
    ...(recommendation.category ? [{ label: 'Category', value: recommendation.category }] : []),
  ];

  return (
    <article className="card p-5">
      {/* Priority, BU, account */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: 'var(--muted)' }}>
          <span className="inline-flex items-center gap-1 font-medium" style={{ color: priority.color }}>
            <priority.Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {priority.label} priority
          </span>
          <span aria-hidden="true">·</span>
          <span>{recommendation.businessUnit}</span>
          <span aria-hidden="true">·</span>
          <span style={{ color: 'var(--ink-2)' }}>{recommendation.accountName}</span>
        </p>
        {recommendation.status !== 'pending' && (
          <span className="badge-info px-1.5 py-0.5 text-xs font-medium" style={{ borderRadius: 'var(--radius-xs)' }}>
            {statusLabel[recommendation.status]}
          </span>
        )}
      </div>

      {/* Recommendation */}
      <h3 className="m-0 mt-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
        {recommendation.title}
      </h3>
      <p className="m-0 mt-1 text-sm" style={{ color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {recommendation.description}
      </p>

      {/* Impact and metadata */}
      <dl
        className="m-0 mt-4 grid gap-x-6 gap-y-3 border-t pt-4"
        style={{ borderColor: 'var(--border)', gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))' }}
      >
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{f.label}</dt>
            <dd className={`m-0 mt-0.5 text-sm font-medium${f.num ? ' num' : ''}`} style={{ color: 'var(--ink)' }}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Actions */}
      {(onAccept || onReview || onDefer) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onAccept && (
            <button type="button" className="btn btn-sm" onClick={() => onAccept(recommendation.id)}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Accept and create action
            </button>
          )}
          {onReview && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onReview(recommendation.id)}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Review details
            </button>
          )}
          {onDefer && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDefer(recommendation.id)}>
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              Defer
            </button>
          )}
        </div>
      )}
    </article>
  );
}
