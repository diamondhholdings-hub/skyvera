'use client';

import React from 'react';
import type { FilterOption } from '../types';
import '../styles.css';

interface RecommendationFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filterId: string) => void;
}

export default function RecommendationFilters({ filters, onFilterChange }: RecommendationFiltersProps) {
  return (
    <div
      className="dm-tabs"
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        borderBottom: '2px solid var(--border)',
        marginBottom: 'var(--space-lg)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`dm-tab ${filter.active ? 'dm-tab-active' : ''}`}
          onClick={() => onFilterChange(filter.id)}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: filter.active ? 'var(--primary-blue)' : 'var(--text-light)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: filter.active ? '3px solid var(--primary-blue)' : '3px solid transparent',
            marginBottom: '-2px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}
        >
          {filter.label}
          <span
            className="dm-tab-count"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              background: filter.active ? 'var(--primary-blue)' : 'var(--background)',
              color: filter.active ? 'var(--white)' : 'var(--text-light)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}
