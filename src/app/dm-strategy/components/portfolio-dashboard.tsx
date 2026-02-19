'use client';

import React, { useState } from 'react';
import type { BusinessUnitMetrics, Recommendation, FilterOption, ImpactProjection } from '../types';
import BUCard from './bu-card';
import RecommendationCard from './recommendation-card';
import RecommendationFilters from './recommendation-filters';
import ImpactCalculator from './impact-calculator';
import AcceptRecommendationModal from './accept-modal';
import '../styles.css';

interface PortfolioDashboardProps {
  businessUnits: BusinessUnitMetrics[];
  recommendations: Recommendation[];
}

export default function PortfolioDashboard({ businessUnits, recommendations }: PortfolioDashboardProps) {
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

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
      label: 'High Impact',
      count: recommendations.filter(r => r.status === 'pending' && r.arrImpact >= 500000).length,
      active: activeFilter === 'high-impact'
    },
    {
      id: 'quick-wins',
      label: 'Quick Wins',
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

  const currentDM = businessUnits.reduce((sum, bu) => sum + bu.currentDM, 0) / businessUnits.length;
  const currentARR = businessUnits.reduce((sum, bu) => sum + bu.arr, 0);

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
    // TODO: Navigate to detailed view
  };

  const handleDefer = async (id: string) => {
    const reason = prompt('Please provide a reason for deferring this recommendation:');
    if (!reason) return;

    try {
      const response = await fetch('/api/dm-strategy/defer-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: id, reason }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Recommendation deferred successfully');
        window.location.reload(); // Reload to show updated status
      } else {
        alert(`Error: ${data.error || 'Failed to defer recommendation'}`);
      }
    } catch (error) {
      console.error('Defer error:', error);
      alert('Failed to defer recommendation');
    }
  };

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
        alert('✓ Recommendation accepted and action item created!');
        window.location.reload(); // Reload to show updated status
      } else {
        alert(`Error: ${data.error || 'Failed to accept recommendation'}`);
      }
    } catch (error) {
      console.error('Accept error:', error);
      alert('Failed to accept recommendation');
    }
  };

  return (
    <div style={{ padding: 'var(--space-lg)' }}>
      <div className="dm-grid-3col">
        {/* Left Sidebar - BU Overview */}
        <div>
          <h2 className="dm-h4" style={{ marginBottom: 'var(--space-lg)' }}>
            Business Units
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {businessUnits.map((bu) => (
              <BUCard
                key={bu.name}
                metrics={bu}
                isActive={selectedBU === bu.name}
                onClick={(buName) => setSelectedBU(buName === selectedBU ? null : buName)}
              />
            ))}
          </div>
        </div>

        {/* Center - Recommendation Feed */}
        <div>
          {selectedBU && (
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <button
                className="dm-btn dm-btn-tertiary dm-btn-sm"
                onClick={() => setSelectedBU(null)}
              >
                ← All Business Units
              </button>
            </div>
          )}

          <RecommendationFilters
            filters={filterOptions}
            onFilterChange={setActiveFilter}
          />

          {/* Additional Filters */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              <option value="Retention">Retention</option>
              <option value="Expansion">Expansion</option>
              <option value="Pricing">Pricing</option>
              <option value="Product">Product</option>
              <option value="Engagement">Engagement</option>
              <option value="Health">Health</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority || ''}
              onChange={(e) => setSelectedPriority(e.target.value || null)}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Clear Filters Button */}
            {(selectedCategory || selectedPriority || selectedBU) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPriority(null);
                  setSelectedBU(null);
                  setActiveFilter('all');
                }}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--muted)'
                }}
              >
                ✕ Clear All Filters
              </button>
            )}
          </div>

          {filteredRecommendations.length === 0 ? (
            <div
              className="dm-card"
              style={{
                textAlign: 'center',
                padding: 'var(--space-xl)',
                color: 'var(--muted)'
              }}
            >
              <p className="dm-body">No recommendations match your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {filteredRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onAccept={handleAccept}
                  onReview={handleReview}
                  onDefer={handleDefer}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Impact Calculator */}
        <div>
          <ImpactCalculator
            projection={projection}
            onAcceptAll={() => {
              // TODO: Implement accept all functionality
            }}
          />
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
