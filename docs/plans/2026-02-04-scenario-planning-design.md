# Interactive Scenario Planning Feature - Design Document

**Date:** 2026-02-04
**Status:** Approved for Implementation

## Overview

Add interactive "what-if" scenario analysis to Skyvera dashboards with Claude-powered natural language chat interface.

## Requirements

1. Chat interface for natural language scenario queries
2. Dynamic data updates and chart re-rendering
3. Scenario comparison capabilities (split-view + dedicated workspace)
4. Works with existing static HTML/Chart.js architecture
5. Support for all scenario types:
   - Revenue growth/decline
   - Pricing changes
   - Customer churn/retention
   - Multi-variable scenarios

## Architecture

### Core Components

1. **Scenario Chat Interface** - Claude API-powered NL parser
2. **Scenario Engine** - JavaScript-based financial calculations
3. **Split-View Mode** - Quick comparison on existing dashboards
4. **Scenario Lab** - Dedicated workspace for complex analysis
5. **Data Layer** - localStorage + JSON export

### Technical Stack

- **Frontend:** Static HTML + JavaScript + Chart.js (existing)
- **AI:** Anthropic Claude API (client-side calls)
- **Storage:** Browser localStorage + JSON export
- **No backend required** - Pure client-side solution

### Architecture Flow

```
User Input → Claude API → Structured Scenario
    ↓
Scenario Engine (calculates deltas)
    ↓
Visualization Layer (Chart.js updates)
    ↓
localStorage (auto-save) + Export (manual)
```

## Data Model

### Scenario Structure

```javascript
{
  id: "scenario_20260204_1234",
  name: "EMIRCOM 3% Monthly Growth",
  created: "2026-02-04T10:30:00Z",
  type: "revenue_growth", // or "pricing", "churn", "multi"

  parameters: {
    customer: "EMIRCOM",
    bu: "Kandy",
    action: "growth",
    value: 0.03,        // 3% per month
    duration: 12,       // months
    startMonth: "Q1'26"
  },

  impacts: {
    arrDelta: +3456000,
    quarterlyDeltas: {
      "Q1'26": +288000,
      "Q2'26": +576000,
      "Q3'26": +864000,
      "Q4'26": +1152000
    },
    buImpact: {
      "Kandy": +3456000
    },
    percentChange: +36.0
  },

  baseline: {
    totalARR: 9586308,
    kandyARR: 13602782
  }
}
```

### Multi-Variable Scenarios

```javascript
{
  type: "multi",
  subScenarios: [
    { /* EMIRCOM growth */ },
    { /* Telstra churn */ }
  ],
  combinedImpacts: { /* aggregated */ }
}
```

## Claude API Integration

### Natural Language Parsing

System prompt instructs Claude to convert queries into structured JSON:

```javascript
const systemPrompt = `You are a financial scenario parser.
Convert user queries into structured JSON scenarios.

Output format:
{
  "type": "revenue_growth" | "pricing" | "churn" | "multi",
  "parameters": {
    "customer": "EMIRCOM",
    "action": "growth" | "decline" | "price_change" | "churn" | "retain",
    "value": 0.03,
    "duration": 12,
    "isPercentage": true
  }
}

Examples:
- "what if EMIRCOM grows by 3% per month"
  → {"type":"revenue_growth", "parameters":{"customer":"EMIRCOM","action":"growth","value":0.03,"duration":12,"isPercentage":true}}

- "what if we double the price on Centrica"
  → {"type":"pricing", "parameters":{"customer":"Centrica Services","action":"price_change","value":2.0,"isPercentage":false}}
`;
```

### API Key Management

- User enters API key in Settings panel (one-time)
- Stored in browser localStorage (encrypted if possible)
- Never sent to any server except Anthropic API
- Fallback to pattern matching if no key provided

## User Interface Components

### 1. Chat Interface (All Dashboards)

Floating chat widget in bottom-right:
- Collapsible panel
- Message history
- Action buttons: "View Scenario", "Save & Compare"
- Streaming responses from Claude

### 2. Split-View Mode (Analytics Dashboard)

- Toggle button: "Compare Scenario"
- Split screen: Baseline (left) | Scenario (right)
- Delta badges on all metrics (+$2.3M, +15%, etc.)
- Charts show both datasets with different colors
- Can toggle back to single view

### 3. Scenario Lab (Dedicated Page: `/scenario-lab.html`)

- Tab bar: "Baseline | Scenario 1 | Scenario 2 | Scenario 3"
- Full dashboard clone for each scenario
- Comparison table showing all scenarios side-by-side
- Export functionality (JSON + PDF report)
- Load saved scenarios from localStorage or file

### 4. Settings Panel

- API Key input (password-masked)
- Default scenario parameters (duration, growth assumptions)
- Chart preferences
- Clear localStorage button

## Scenario Calculation Engine

### Core Functions

```javascript
class ScenarioEngine {
  // Revenue growth over time
  calculateGrowth(baseline, rate, months) {
    let current = baseline;
    const deltas = {};
    for (let i = 1; i <= months; i++) {
      current *= (1 + rate);
      deltas[`month_${i}`] = current - baseline;
    }
    return { finalValue: current, deltas };
  }

  // Pricing impact with churn risk
  calculatePricing(customer, multiplier) {
    const newARR = customer.rr * multiplier;
    const churnRisk = multiplier > 1.5 ? 0.3 : multiplier < 0.8 ? 0.4 : 0.1;
    return {
      arrDelta: newARR - customer.rr,
      newPrice: multiplier,
      assumedChurnRisk: churnRisk
    };
  }

  // Customer churn impact
  calculateChurn(customer) {
    return {
      arrDelta: -customer.rr,
      buImpact: customer.bu,
      concentrationRisk: customer.pct_of_total
    };
  }

  // Combine multiple scenarios
  combineScenarios(scenarios) {
    // Aggregate deltas, handle conflicts
    // Return combined impact
  }
}
```

### Chart Update Strategy

1. Clone baseline Chart.js configuration
2. Inject scenario data as additional dataset
3. Use different colors/styles (dashed lines, different bar patterns)
4. Add delta labels to axes
5. Update legend to show both baseline and scenario

## Scenario Persistence

### localStorage Schema

```javascript
{
  "scenarios": {
    "scenario_001": { /* scenario object */ },
    "scenario_002": { /* scenario object */ }
  },
  "apiKey": "sk-ant-...",
  "settings": {
    "defaultDuration": 12,
    "preferredView": "split"
  }
}
```

### Export Format

JSON file with full scenario data + metadata:
```json
{
  "exported": "2026-02-04T10:30:00Z",
  "skyvera_version": "1.0",
  "scenarios": [ /* array of scenarios */ ],
  "baseline_snapshot": { /* baseline data at export time */ }
}
```

## Implementation Phases

### Phase 1: Foundation
- Create scenario-lab.html page
- Implement ScenarioEngine class
- Add localStorage persistence
- Basic UI without Claude integration

### Phase 2: Claude Integration
- Add Anthropic JS SDK
- Implement chat interface
- Build prompt engineering layer
- Add pattern-matching fallback

### Phase 3: Split-View
- Add split-view toggle to analytics dashboard
- Implement side-by-side comparison
- Delta badge system
- Chart duplication and updates

### Phase 4: Advanced Features
- Multi-scenario comparison table
- PDF export
- Scenario templates library
- Share scenarios via URL parameters

## Success Criteria

- ✅ Can ask "what if EMIRCOM grows 3% monthly" and see impact
- ✅ Can compare baseline vs scenario side-by-side
- ✅ Can save and reload scenarios
- ✅ Works without API key (limited functionality)
- ✅ Charts update dynamically with scenario data
- ✅ Can export scenarios as JSON files

## Security & Privacy

- API key stored only in localStorage (client-side)
- No data sent to any server except Anthropic API
- Scenarios stored locally or exported as files
- No server-side logging or tracking

## Future Enhancements

- Monte Carlo simulation for uncertainty modeling
- Scenario scheduling/calendars
- Integration with Excel budget file for live data
- Collaborative scenarios (team sharing via git)
- Scenario version history
