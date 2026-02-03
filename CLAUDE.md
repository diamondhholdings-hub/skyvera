# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a business analysis repository for Skyvera, a multi-business unit SaaS company with three primary verticals:
- **Cloudsense** - Largest BU by revenue (~$8M quarterly)
- **Kandy** - Mid-size BU (~$3.3M quarterly)
- **STL (Software Technology Labs)** - Smaller BU (~$1M quarterly)

The repository contains financial analysis, budgeting data, and executive dashboards for strategic decision-making.

## Key Files

### Budget Data
- **`2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`** - Master budget file containing:
  - Multiple business unit P&Ls (Cloudsense, Kandy, STL)
  - Recurring Revenue (RR) and Non-Recurring Revenue (NRR) forecasts
  - Headcount (HC) budget and planning
  - Vendor cost analysis
  - Accounts Receivable (AR) aging analysis
  - Margin target tracking

### Dashboards
- **`Business_Analysis_Dashboard.html`** - Interactive executive dashboard
  - Self-contained HTML file with Chart.js for visualizations
  - No build process required - open directly in browser
  - Displays KPIs, BU performance, cost breakdowns, and strategic recommendations

## Working with Excel Budget Files

When analyzing the Excel file, key sheets include:
- **P&Ls** - Consolidated profit & loss statement
- **P&Ls - Cloudsense/Kandy/STL** - Business unit specific P&Ls
- **RR Summary** - Recurring revenue analysis with ARR calculations and decline metrics
- **NRR Summary** - Non-recurring revenue tracking
- **HC Budget Input** - Headcount planning with XO contractor data
- **Vendor Pivots** - Vendor cost analysis (watch for large contracts like Salesforce UK: $4.1M annual)
- **AR Aging** - Accounts receivable > 90 days (critical for revenue recognition)

### Reading Excel Data with Python

Use `openpyxl` library for Excel file manipulation:

```python
from openpyxl import load_workbook

file_path = "2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx"
wb = load_workbook(file_path, data_only=True)  # data_only=True for calculated values

# Access specific sheet
ws = wb['P&Ls']

# Iterate through rows
for row in ws.iter_rows(values_only=True):
    print(row)
```

**Important:** Install openpyxl first: `pip3 install openpyxl`

## Dashboard Operations

### Opening the Dashboard
```bash
open Business_Analysis_Dashboard.html
```

### Modifying Dashboard Data
The dashboard has hardcoded data in the JavaScript section at the bottom of the HTML file. To update:
1. Locate the Chart.js configuration objects
2. Update the `data` arrays with new values from Excel analysis
3. Ensure labels and datasets remain synchronized

Key metrics embedded in dashboard:
- Total Revenue: $14.7M
- Recurring Revenue: $12.6M (86% of total)
- Net Margin: 62.5% (target: 68.7%)
- EBITDA: $9.2M
- Headcount: 58 FTEs

## Business Context & Critical Metrics

### Key Financial Issues (Q1'26)
1. **FY'25 EBITDA Test: FAILED** - Primary concern requiring immediate investigation
2. **RR Declining -$336K** - Recurring revenue contraction vs. prior plan
3. **Margin Gap: -$918K** - Missing target by 6.2 percentage points
4. **AR > 90 Days: $1.28M** - Collection/churn risk
5. **Salesforce UK Contract: $4.1M/year** - Largest vendor cost (64% of Cloudsense Q1'26 revenue)

### Business Unit Margins
- **Cloudsense**: 59.2% net margin (target: 63.6%)
- **Kandy**: 63.2% net margin (target: 75%)
- **STL**: 61.2% net margin (target: 75%)

### Cost Structure
- COGS: 21% of revenue
- Headcount: 8% (but increasing rapidly)
- Vendor/CF costs: 43% (Salesforce UK dominates)
- Core Allocation: 17%

## Analysis Workflow

When analyzing the business:

1. **Extract data from Excel** using Python/openpyxl
2. **Focus on key sheets**: P&Ls, RR Summary, Vendor Pivots, HC Budget Input
3. **Compare Q1'26 Plan vs Prior Plan** columns to identify variances
4. **Calculate key ratios**: Gross Margin, Net Margin, RR as % of Total Revenue
5. **Identify top cost drivers** from Vendor Pivots (anything >$50K/quarter)
6. **Update dashboard** with new metrics if needed

## Financial Terminology

- **RR (Recurring Revenue)**: Predictable subscription revenue, the foundation metric
- **NRR (Non-Recurring Revenue)**: One-time revenue (services, licenses)
- **ARR (Annual Recurring Revenue)**: RR × 4 quarters
- **DM% (Decline/Maintenance Rate)**: Natural attrition rate for RR
- **EBITDA**: Earnings before interest, taxes, depreciation, amortization
- **HC (Headcount)**: Full-time employee count and costs
- **NHC (Non-Headcount)**: Non-salary expenses
- **CF (Cash Flow/Vendor)**: Vendor and contractor costs
- **AR > 90 days**: Aged receivables indicating collection risk

## Python Environment

Recommended packages for analysis:
```bash
pip3 install openpyxl  # Excel file reading
```

Note: `pandas` is NOT currently installed but can be added if needed for more complex data manipulation.
