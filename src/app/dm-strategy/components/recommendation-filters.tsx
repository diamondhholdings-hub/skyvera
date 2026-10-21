'use client';

import React from 'react';
import type { FilterOption } from '../types';

interface RecommendationFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filterId: string) => void;
}

export default function RecommendationFilters({ filters, onFilterChange }: RecommendationFiltersProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="segmented" role="group" aria-label="Recommendation preset">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={filter.active}
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.label}
            <span className="num" style={{ color: 'var(--muted)' }}>{filter.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
