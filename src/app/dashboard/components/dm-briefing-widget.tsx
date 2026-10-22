'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, CircleAlert, TriangleAlert } from 'lucide-react';
import type { Recommendation } from '@/app/dm-strategy/types';

interface DMBriefingWidgetProps {
  recommendations: Recommendation[];
  maxItems?: number;
}

export default function DMBriefingWidget({ recommendations, maxItems = 5 }: DMBriefingWidgetProps) {
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAccept = async (recId: string) => {
    // Optimistic update: hide immediately, revert if the request fails
    setPendingId(recId);
    setAcceptedIds((prev) => new Set(prev).add(recId));

    try {
      const response = await fetch('/api/dm-strategy/accept-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept recommendation');
      }
      toast.success('Recommendation accepted');
    } catch (error) {
      setAcceptedIds((prev) => {
        const next = new Set(prev);
        next.delete(recId);
        return next;
      });
      toast.error(error instanceof Error ? error.message : 'Failed to accept recommendation');
    } finally {
      setPendingId(null);
    }
  };

  // Get urgent recommendations (critical and high priority)
  const urgentRecommendations = recommendations
    .filter(r => r.status === 'pending' && (r.priority === 'critical' || r.priority === 'high') && !acceptedIds.has(r.id))
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

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <h3 className="m-0">Revenue retention priorities</h3>
          <p className="m-0 mt-0.5 text-[13px]" style={{ color: 'var(--muted)' }}>
            Pending critical and high-priority recommendations, by ARR impact
          </p>
        </div>
        <Link href="/dm-strategy" className="btn btn-sm">
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Recommendations List */}
      {urgentRecommendations.length === 0 ? (
        <div className="px-5 py-8 text-center" style={{ color: 'var(--muted)' }}>
          <p className="m-0 text-sm">No urgent recommendations at this time.</p>
          <p className="m-0 mt-1 text-xs">All accounts are on track with retention targets.</p>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {urgentRecommendations.map((rec) => {
            const isCritical = rec.priority === 'critical';
            const PriorityIcon = isCritical ? CircleAlert : TriangleAlert;
            const priorityColor = isCritical ? 'var(--critical-ink)' : 'var(--warning-ink)';

            return (
              <li
                key={rec.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-3"
                style={{ borderColor: 'var(--border)' }}
              >
                {/* Priority */}
                <span
                  className="flex w-[4.5rem] shrink-0 items-center gap-1.5 text-xs font-medium"
                  style={{ color: priorityColor }}
                >
                  <PriorityIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {isCritical ? 'Critical' : 'High'}
                </span>

                {/* Account & title */}
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium" style={{ color: 'var(--ink)' }}>
                      {rec.accountName}
                    </span>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>
                      {rec.businessUnit}
                    </span>
                  </div>
                  <p className="m-0 truncate text-[13px]" style={{ color: 'var(--ink-2)' }}>
                    {rec.title}
                  </p>
                </div>

                {/* Impact & Actions */}
                <span
                  className="num shrink-0 text-right text-sm font-medium"
                  style={{ minWidth: '6.5rem', color: rec.arrImpact > 0 ? 'var(--success-ink)' : 'var(--muted)' }}
                >
                  {formatCurrency(rec.arrImpact)} ARR
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={pendingId === rec.id}
                    aria-disabled={pendingId === rec.id}
                    onClick={() => handleAccept(rec.id)}
                    style={{ cursor: pendingId === rec.id ? 'wait' : undefined }}
                  >
                    Accept
                  </button>
                  <Link href={`/dm-strategy?rec=${rec.id}`} className="btn btn-ghost btn-sm">
                    Details
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Summary Footer */}
      {urgentRecommendations.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: 'var(--surface-2)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            Total potential impact
          </span>
          <span className="num text-base font-semibold" style={{ color: 'var(--ink)' }}>
            {formatCurrency(
              urgentRecommendations.reduce((sum, r) => sum + r.arrImpact, 0)
            )}
          </span>
        </div>
      )}
    </div>
  );
}
