'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { BusinessUnitMetrics, Recommendation, FilterOption, ImpactProjection } from '../types';
import { BUTable } from './bu-card';
import RecommendationCard from './recommendation-card';
import RecommendationFilters from './recommendation-filters';
import ImpactCalculator from './impact-calculator';
import AcceptRecommendationModal from './accept-modal';
import { DM_SENSITIVITY_TABLE, DM_THRESHOLDS } from '@/lib/intelligence/dm-strategy/constants';
import { ArrowLeft, X } from 'lucide-react';
import { useDialogFocus } from './use-dialog-focus';

interface PortfolioDashboardProps {
  businessUnits: BusinessUnitMetrics[];
  recommendations: Recommendation[];
}

export default function PortfolioDashboard({ businessUnits, recommendations }: PortfolioDashboardProps) {
  const router = useRouter();
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [deferringId, setDeferringId] = useState<string | null>(null);
  const [deferReason, setDeferReason] = useState('');

  // Filter recommendations based on all active filters
  const filteredRecommendations = recommendations.filter((rec) => {
    // Filter by BU
    if (selectedBU && rec.businessUnit !== selectedBU) return false;

    // Filter by status (only show pending)
    if (rec.status !== 'pending') return false;

    // Filter by category
    if (selectedCategory && rec.category !== selectedCategory) return false;

    // Filter by priority
    if (selectedPriority && rec.priority !== selectedPriority) return false;

    // Filter by preset filters
    if (activeFilter === 'critical' && rec.priority !== 'critical') return false;
    if (activeFilter === 'high-impact' && rec.arrImpact < 500000) return false;
    if (activeFilter === 'quick-wins' && (rec.risk !== 'Low' || rec.arrImpact < 100000)) return false;

    return true;
  });

  // Calculate filter counts
  const filterOptions: FilterOption[] = [
    {
      id: 'all',
      label: 'All',
      count: recommendations.filter(r => r.status === 'pending').length,
      active: activeFilter === 'all'
    },
    {
      id: 'critical',
      label: 'Critical',
      count: recommendations.filter(r => r.status === 'pending' && r.priority === 'critical').length,
      active: activeFilter === 'critical'
    },
    {
      id: 'high-impact',
      label: 'High impact',
      count: recommendations.filter(r => r.status === 'pending' && r.arrImpact >= 500000).length,
      active: activeFilter === 'high-impact'
    },
    {
      id: 'quick-wins',
      label: 'Quick wins',
      count: recommendations.filter(r => r.status === 'pending' && r.risk === 'Low' && r.arrImpact >= 100000).length,
      active: activeFilter === 'quick-wins'
    }
  ];

  // Calculate impact projection
  const acceptedCount = recommendations.filter(r => r.status === 'accepted').length;
  const totalDMImpact = recommendations
    .filter(r => r.status === 'accepted')
    .reduce((sum, r) => sum + r.dmImpact, 0);
  const totalARRImpact = recommendations
    .filter(r => r.status === 'accepted')
    .reduce((sum, r) => sum + r.arrImpact, 0);

  // ARR-weighted, not a straight per-BU average — an unweighted mean would
  // let a small BU's DM% swing the portfolio figure as much as a large one.
  const currentARR = businessUnits.reduce((sum, bu) => sum + bu.arr, 0);
  const currentDM = currentARR > 0
    ? businessUnits.reduce((sum, bu) => sum + bu.currentDM * bu.arr, 0) / currentARR
    : 0;

  const projection: ImpactProjection = {
    currentDM,
    projectedDM: currentDM + totalDMImpact,
    dmDelta: totalDMImpact,
    currentARR,
    projectedARR: currentARR + totalARRImpact,
    arrDelta: totalARRImpact,
    acceptedRecommendations: acceptedCount,
    totalRecommendations: recommendations.length
  };

  // Handle recommendation actions
  const handleAccept = (id: string) => {
    const rec = recommendations.find(r => r.id === id);
    if (rec) {
      setSelectedRecommendation(rec);
      setIsModalOpen(true);
    }
  };

  const handleReview = (id: string) => {
    const rec = recommendations.find(r => r.id === id);
    if (!rec) return;
    if (!rec.accountName || rec.accountName === 'Portfolio-wide') {
      toast.info(`This is a portfolio-wide recommendation for ${rec.businessUnit}, so there is no single account page.`);
      return;
    }
    router.push(`/accounts/${encodeURIComponent(rec.accountName)}`);
  };

  const handleDeferOpen = (id: string) => {
    setDeferringId(id);
    setDeferReason('');
  };

  const handleDeferSubmit = async () => {
    if (!deferringId || !deferReason.trim()) {
      toast.error('Please provide a reason for deferring this recommendation.');
      return;
    }

    const id = deferringId;
    setDeferringId(null);

    try {
      const response = await fetch('/api/dm-strategy/defer-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: id, reason: deferReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Recommendation deferred successfully.');
        window.location.reload();
      } else {
        toast.error(`Error: ${data.error || 'Failed to defer recommendation'}`);
      }
    } catch (error) {
      console.error('Defer error:', error);
      toast.error('Failed to defer recommendation.');
    }
  };

  const handleDeferCancel = () => {
    setDeferringId(null);
    setDeferReason('');
  };
  const deferDialogRef = useDialogFocus<HTMLDivElement>(deferringId !== null, handleDeferCancel);

  const handleModalSubmit = async (actionItem: any) => {
    if (!selectedRecommendation) return;

    try {
      const response = await fetch('/api/dm-strategy/accept-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: selectedRecommendation.id,
          actionItem,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Recommendation accepted and action item created.');
        window.location.reload();
      } else {
        toast.error(`Error: ${data.error || 'Failed to accept recommendation'}`);
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('Failed to accept recommendation.');
    }
  };

  const hasExtraFilters = Boolean(selectedCategory || selectedPriority || selectedBU);

  return (
    <div className="space-y-6">
      {/* Business units: one row per BU, click to filter recommendations */}
      <BUTable
        businessUnits={businessUnits}
        selectedBU={selectedBU}
        onSelect={(buName) => setSelectedBU(buName === selectedBU ? null : buName)}
      />

      {/* Defer reason dialog */}
      {deferringId && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: 'color-mix(in oklch, var(--ink) 40%, transparent)' }}
        >
          <div
            ref={deferDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="defer-dialog-title"
            aria-describedby="defer-dialog-desc"
            className="w-full max-w-[480px] p-5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 id="defer-dialog-title" className="m-0 text-base font-semibold">
              Defer recommendation
            </h3>
            <label id="defer-dialog-desc" htmlFor="defer-reason" className="mb-3 mt-1 block text-sm" style={{ color: 'var(--muted)' }}>
              Give a reason for deferring this recommendation.
            </label>
            <textarea
              id="defer-reason"
              className="input"
              style={{ height: 'auto', padding: '0.5rem 0.75rem' }}
              value={deferReason}
              onChange={(e) => setDeferReason(e.target.value)}
              placeholder="Enter reason"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn" onClick={handleDeferCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDeferSubmit}
                disabled={!deferReason.trim()}
              >
                Defer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations + sidebar */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* Left: recommendation feed */}
        <section aria-labelledby="recs-heading" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="recs-heading" className="m-0 text-lg font-semibold">
              Recommendations{selectedBU ? ` for ${selectedBU}` : ''}
            </h2>
            <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}>
              Pending only · ranked by ARR impact and confidence
            </p>
          </div>

          {selectedBU && (
            <div className="mb-3">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedBU(null)}>
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                All business units
              </button>
            </div>
          )}

          {/* Filters */}
          <fieldset className="m-0 mb-4 flex flex-wrap items-center gap-2 border-0 p-0">
            <legend className="sr-only">Filter recommendations</legend>
            <RecommendationFilters
              filters={filterOptions}
              onFilterChange={setActiveFilter}
            />

            {/* Category Filter */}
            <select
              aria-label="Category"
              className="input"
              style={{ width: 'auto', height: '2rem' }}
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">All categories</option>
              <option value="Retention">Retention</option>
              <option value="Expansion">Expansion</option>
              <option value="Pricing">Pricing</option>
              <option value="Product">Product</option>
              <option value="Engagement">Engagement</option>
              <option value="Health">Health</option>
            </select>

            {/* Priority Filter */}
            <select
              aria-label="Priority"
              className="input"
              style={{ width: 'auto', height: '2rem' }}
              value={selectedPriority || ''}
              onChange={(e) => setSelectedPriority(e.target.value || null)}
            >
              <option value="">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Clear Filters Button */}
            {hasExtraFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPriority(null);
                  setSelectedBU(null);
                  setActiveFilter('all');
                }}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </fieldset>

          {filteredRecommendations.length === 0 ? (
            <div
              className="p-6 text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--muted)' }}
            >
              No recommendations match these filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={handleAccept}
                  onReview={handleReview}
                  onDefer={handleDeferOpen}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right sidebar: impact calculator + sensitivity reference */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <ImpactCalculator
            projection={projection}
            onAcceptAll={() => {
              // TODO: Implement accept all functionality
            }}
          />

          {/* Sensitivity reference */}
          <section className="card overflow-hidden" aria-labelledby="sensitivity-heading">
            <div className="px-5 pb-3 pt-4">
              <h2 id="sensitivity-heading" className="m-0 text-base font-semibold">DM% sensitivity</h2>
              <p className="m-0 mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                Annual DM compounded to quarterly and monthly rates. Floors: monthly{' '}
                <span className="num">{DM_THRESHOLDS.monthly.floor}%</span>, quarterly{' '}
                <span className="num">{DM_THRESHOLDS.quarterly.floor}%</span>, TTM{' '}
                <span className="num">{DM_THRESHOLDS.annual.floor}%</span>.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th scope="col">Annual</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Quarterly</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Monthly</th>
                    <th scope="col">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {DM_SENSITIVITY_TABLE.map((row) => {
                    const isFloor = row.annualDM === 90;
                    const isBreakeven = row.annualDM === 100;
                    const isMarker = isFloor || isBreakeven;
                    return (
                      <tr
                        key={row.annualDM}
                        style={{ background: isMarker ? 'var(--surface-2)' : undefined, fontWeight: isMarker ? 600 : 400 }}
                      >
                        <td className="num" style={{ padding: '0.375rem 0.75rem' }}>{row.annualDM}%</td>
                        <td className="num" style={{ padding: '0.375rem 0.75rem', textAlign: 'right' }}>
                          {row.quarterlyDM.toFixed(1)}%
                        </td>
                        <td className="num" style={{ padding: '0.375rem 0.75rem', textAlign: 'right' }}>
                          {row.monthlyDM.toFixed(1)}%
                        </td>
                        <td style={{ padding: '0.375rem 0.75rem', color: isMarker ? 'var(--ink)' : 'var(--muted)' }}>
                          {isFloor ? 'Floor' : row.verdict}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Accept Modal */}
      {selectedRecommendation && (
        <AcceptRecommendationModal
          recommendation={selectedRecommendation}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecommendation(null);
          }}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
