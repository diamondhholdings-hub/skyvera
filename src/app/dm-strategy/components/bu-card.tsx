'use client';

import React from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import type { BusinessUnitMetrics } from '../types';
import { DM_SCENARIOS, DM_THRESHOLDS } from '@/lib/intelligence/dm-strategy/constants';

interface BUCardProps {
  metrics: BusinessUnitMetrics;
  isActive?: boolean;
  onClick?: (bu: string) => void;
}

const formatARR = (v: number) =>
  v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

/** TTM status vs the annual floor and the BU's target: icon + word, never color alone */
function ttmStatus(metrics: BusinessUnitMetrics) {
  if (metrics.ttmDM < DM_THRESHOLDS.annual.floor) {
    return { Icon: CircleX, label: 'Below floor', color: 'var(--critical-ink)' };
  }
  if (metrics.ttmDM < metrics.targetDM) {
    return { Icon: TriangleAlert, label: 'Below target', color: 'var(--warning-ink)' };
  }
  return { Icon: CircleCheck, label: 'On target', color: 'var(--success-ink)' };
}

/**
 * One business unit as a table row. Clicking the row (or its name button)
 * filters the recommendations below to that BU.
 */
export default function BUCard({ metrics, isActive = false, onClick }: BUCardProps) {
  const scenario = metrics.scenario ? DM_SCENARIOS[metrics.scenario] : null;
  const status = ttmStatus(metrics);
  const quarterly = metrics.thresholdViolations?.find((v) => v.period === 'quarterly');

  const TrendIcon = metrics.trend === 'up' ? ArrowUpRight : metrics.trend === 'down' ? ArrowDownRight : ArrowRight;
  const trendColor = metrics.trend === 'up' ? 'var(--success-ink)' : metrics.trend === 'down' ? 'var(--critical-ink)' : 'var(--muted)';

  return (
    <tr
      onClick={() => onClick?.(metrics.name)}
      style={{ cursor: onClick ? 'pointer' : 'default', background: isActive ? 'var(--highlight)' : undefined }}
    >
      <td>
        <button
          type="button"
          aria-pressed={isActive}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(metrics.name);
          }}
          className="text-sm font-medium"
          style={{ background: 'none', border: 0, padding: 0, color: 'var(--ink)', cursor: 'pointer', textAlign: 'left' }}
        >
          {metrics.name}
        </button>
      </td>
      <td className="num text-sm font-semibold" style={{ textAlign: 'right', color: status.color }}>
        {metrics.ttmDM.toFixed(1)}%
      </td>
      <td>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm" style={{ color: status.color }}>
          <status.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {status.label}
        </span>
      </td>
      <td className="num text-sm" style={{ textAlign: 'right', color: 'var(--ink)' }}>
        <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
          {quarterly?.isViolation && (
            <span
              className={`px-1.5 py-0.5 text-xs font-medium ${quarterly.isRedFlag ? 'badge-critical' : 'badge-warning'}`}
              style={{ borderRadius: 'var(--radius-xs)' }}
            >
              {quarterly.isRedFlag ? 'Red flag' : 'Below floor'}
            </span>
          )}
          {metrics.quarterlyDM.toFixed(1)}%
        </span>
      </td>
      <td className="num text-sm" style={{ textAlign: 'right', color: 'var(--ink)' }}>
        {metrics.currentDM.toFixed(1)}%
      </td>
      <td className="text-sm" style={{ color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
        {scenario?.label ?? <span style={{ color: 'var(--muted)' }}>Unclassified</span>}
      </td>
      <td className="num text-sm" style={{ textAlign: 'right', color: 'var(--ink)' }}>
        {formatARR(metrics.arr)}
      </td>
      <td className="num text-sm" style={{ textAlign: 'right', color: trendColor, whiteSpace: 'nowrap' }}>
        <span className="relative inline-flex items-center justify-end gap-1">
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{metrics.trend === 'up' ? 'Up' : metrics.trend === 'down' ? 'Down' : 'Flat'}</span>
          {metrics.trendValue >= 0 ? '+' : ''}{metrics.trendValue.toFixed(1)} pts
        </span>
      </td>
      <td className="num text-sm" style={{ textAlign: 'right', color: 'var(--ink)' }}>
        {metrics.recommendationCount}
      </td>
    </tr>
  );
}

interface BUTableProps {
  businessUnits: BusinessUnitMetrics[];
  selectedBU: string | null;
  onSelect: (bu: string) => void;
}

/** Business units panel: one row per BU, click a row to filter recommendations */
export function BUTable({ businessUnits, selectedBU, onSelect }: BUTableProps) {
  return (
    <section className="card overflow-hidden" aria-labelledby="bu-table-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        <h2 id="bu-table-heading" className="m-0 text-base font-semibold">Business units</h2>
        <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}>
          Select a row to filter recommendations · TTM floor {DM_THRESHOLDS.annual.floor}% · target {DM_THRESHOLDS.annual.target}%
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table" style={{ minWidth: '58rem' }}>
          <thead>
            <tr>
              <th scope="col">Business unit</th>
              <th scope="col" style={{ textAlign: 'right' }}>TTM DM%</th>
              <th scope="col">Status</th>
              <th scope="col" style={{ textAlign: 'right' }}>Vs prior quarter</th>
              <th scope="col" style={{ textAlign: 'right' }}>Vs prior plan</th>
              <th scope="col">Scenario</th>
              <th scope="col" style={{ textAlign: 'right' }}>ARR</th>
              <th scope="col" style={{ textAlign: 'right' }}>Trend</th>
              <th scope="col" style={{ textAlign: 'right' }}>Recs</th>
            </tr>
          </thead>
          <tbody>
            {businessUnits.map((bu) => (
              <BUCard key={bu.name} metrics={bu} isActive={selectedBU === bu.name} onClick={onSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
