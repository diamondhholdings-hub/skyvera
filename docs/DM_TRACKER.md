# DM% Tracking & Forecasting System

## Overview

The DM% (Decline/Maintenance Rate) tracking system measures revenue retention by comparing current period revenue to prior period revenue. This is a critical metric for SaaS businesses to understand customer retention and revenue stability.

## Formula

```
DM% = (Current Year Revenue / Prior Year Revenue) × 100
```

**Target:** ≥90% (retain at least 90% of last year's revenue)

## Components

### 1. Data Extraction Script

**File:** `scripts/extract_dm_data.py`

Extracts revenue data from the Excel budget file and calculates DM% for each business unit:
- Cloudsense
- Kandy
- STL

**Output:** JSON containing:
- Business unit specific DM% data
- Consolidated DM% across all BUs
- TTM (Trailing Twelve Months) historical trends
- Forecast for next 4 quarters

**Usage:**
```bash
python3 scripts/extract_dm_data.py
```

### 2. Server-Side Data Layer

**File:** `src/lib/data/server/dm-tracker-data.ts`

Server-side function to fetch DM% data with caching:
- `getDMTrackerData()`: Returns complete DM% tracking dataset
- Cached with 5-minute TTL (30 minutes in DEMO_MODE)
- Error handling and validation

### 3. React Components

#### DMTracker Component
**File:** `src/app/dashboard/components/dm-tracker.tsx`

Main server component that displays:
- Consolidated DM% alert (green if passing, red if failing)
- Business unit DM% performance cards
- Detailed breakdown table
- TTM trend chart
- Forecast analysis

#### DMTrendChart Component
**File:** `src/app/dashboard/components/dm-trend-chart.tsx`

Client-side Chart.js component showing:
- Historical TTM DM% trends
- Forecasted DM% for next 4 quarters
- 90% target line
- Per-BU trends for comparison

### 4. Integration

The DM Tracker is integrated into the Executive Dashboard:
- **Section:** Financial Detailed Analysis
- **Route:** `/dashboard` → "Detailed Analysis" tab
- **Test Route:** `/test-dm-tracker` (standalone test page)

## Data Structure

### BUDMData
```typescript
{
  bu: string                    // Business unit name
  current_rr: number           // Current quarter recurring revenue
  prior_rr: number             // Prior quarter recurring revenue
  dm_pct: number               // DM% calculation
  variance: number             // Dollar variance
  meets_target: boolean        // true if DM% ≥ 90%
  ttm_quarters: DMQuarterData[] // Last 4 quarters of data
}
```

### ConsolidatedDMData
```typescript
{
  current_rr: number           // Total RR across all BUs
  prior_rr: number             // Prior total RR
  dm_pct: number               // Consolidated DM%
  variance: number             // Total variance
  meets_target: boolean        // Overall status
  target: 90.0                 // Target threshold
  ttm_quarters: DMQuarterData[] // Historical trends
}
```

### DMForecastQuarter
```typescript
{
  quarter: string              // Quarter label (e.g., "Q2'26")
  forecasted_rr: number        // Forecasted recurring revenue
  forecasted_dm_pct: number    // Forecasted DM%
  confidence: 'high' | 'medium' | 'low'
}
```

## Forecasting Model

**Method:** Linear trend analysis

The forecast is calculated based on:
1. Average quarterly decline rate across all BUs
2. Simple linear regression from last 4 quarters
3. Confidence decreases over time:
   - **Medium confidence:** Next 2 quarters
   - **Low confidence:** Quarters 3-4

## Visual Design

The DM Tracker follows the executive dashboard editorial theme:
- **Typography:** System fonts with clean hierarchy
- **Color Coding:**
  - Green gradient: Passing (DM% ≥ 90%)
  - Red gradient: Failing (DM% < 90%)
  - Blue: Neutral/informational
- **Layout:** Responsive grid with cards and tables
- **Charts:** Clean line charts with clear legends

## Status Indicators

| DM% Range | Status | Color | Interpretation |
|-----------|--------|-------|----------------|
| ≥ 90%     | PASSING | Green | Healthy revenue retention |
| < 90%     | FAILING | Red | Revenue contraction - action required |

## Example Output

### Consolidated DM%: 97.37% (PASSING)
- **Current RR:** $10.50M
- **Prior RR:** $10.78M
- **Variance:** -$284K
- **Status:** Above 90% target

### Business Unit Breakdown:
- **Cloudsense:** 94.72% (PASSING) - Slight decline but within acceptable range
- **Kandy:** 97.79% (PASSING) - Strong retention
- **STL:** 122.23% (PASSING) - Significant growth

## Key Insights

1. **Overall Health:** Consolidated DM% of 97.37% indicates strong revenue retention
2. **Growth Opportunity:** STL showing 122% indicates expansion within existing customer base
3. **Watch Area:** Cloudsense at 94.72% is closest to the 90% threshold
4. **Forecast:** Linear trend suggests continued stability with slight decline

## Usage in Decision Making

### For Executives:
- Quick health check on revenue retention
- Identify BUs requiring attention
- Understand revenue stability for forecasting

### For Finance:
- Track against retention targets
- Model future revenue scenarios
- Identify margin compression risks

### For Sales:
- Understand customer retention by BU
- Prioritize renewal efforts
- Identify expansion opportunities

## Dependencies

- **Python:** openpyxl for Excel parsing
- **Node.js:** Chart.js for visualization
- **Next.js:** Server components for data fetching
- **Excel Source:** `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`

## Future Enhancements

1. **Customer-Level DM%:** Break down by individual customers
2. **Product-Level DM%:** Track by product line within each BU
3. **Cohort Analysis:** Compare DM% across customer cohorts
4. **Advanced Forecasting:** ML-based forecasting with seasonality
5. **Alert System:** Automated alerts when DM% drops below threshold
6. **Historical Comparison:** Multi-year DM% trends
