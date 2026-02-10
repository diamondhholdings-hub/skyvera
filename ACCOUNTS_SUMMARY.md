# Customer Account Pages - Generation Summary

## Overview
Generated standalone HTML files for all customer accounts across all business units.

## Output Location
**Directory:** `/Users/RAZER/Documents/projects/Skyvera/accounts/`

## Files Generated
- **Total Files:** 115 HTML files (114 customer accounts + 1 index page)
- **Index Page:** `accounts/index.html` - Directory of all accounts
- **Individual Pages:** One HTML file per customer account
- **Note:** 3 accounts with duplicate names (different case) resulted in file overwrites

## Breakdown by Business Unit

### CloudSense - 55 accounts
Top accounts:
- Liquid Telecom ($2.49M)
- Telefonica UK Limited ($2.10M)
- Telstra Corporation Limited ($1.97M)
- Masergy ($1.92M)
- Vodafone Netherlands ($1.84M)

### Kandy - 21 accounts
Top accounts:
- EMIRCOM ($9.59M) - Largest single customer
- AT&T SERVICES, INC. ($2.52M)
- PIONEER TELEPHONE COOPERATIVE ($302K)
- ISSQUARED, INC. ($295K)
- HARGRAY COMMUNICATIONS GROUP ($158K)

### STL - 19 accounts
Top accounts:
- One Albania ($1.84M)
- Commverge Solutions Philippines Inc. ($346K)
- Teleindia Networks Private Limited ($341K)
- PT. Supra Primatama Nusantara ($275K)
- Ericsson Telecommunications, Inc. ($177K)

### NewNet - 22 accounts
Top accounts:
- NS Solutions Corporation ($2.46M)
- HCL TECHNOLOGIES UK LIMITED ($2.08M)
- Vodafone GmbH ($483K)
- Mobile Interim Company 1 S.A.L. ($278K)
- Vodafone Egypt ($275K)

## Features

### Account Page Layout
Each account page includes:
- **Editorial Theme:** Cormorant Garamond headings + DM Sans body text
- **Header Stats:** Total Revenue, RR, NRR, Health Score
- **Subscriptions Table:** Active subscriptions with renewal status
- **Account Overview:** BU, rank, revenue percentage, subscription count
- **Navigation:** Breadcrumbs linking back to index and main dashboard
- **Health Score:** Calculated based on renewal risk and revenue mix

### Index Page
- **Sortable Directory:** All accounts in one table (117 unique customers)
- **Columns:** Rank, Customer Name, BU, Total Revenue, RR, NRR, Health Status
- **Clickable Links:** Each customer name links to individual account page
- **Clean Design:** Sticky header, hover effects, editorial styling

### Design System
- **Colors:** 
  - Ink (#1a1a1a) on Paper (#fafaf8)
  - Accent red (#c84b31)
  - Secondary navy (#2d4263)
- **Typography:**
  - Serif headings (Cormorant Garamond)
  - Sans-serif body (DM Sans)
- **Health Badges:**
  - Green: Healthy (score ≥ 80)
  - Yellow: At Risk (score 60-79)
  - Orange: Critical (score 40-59)
  - Red: Churned (score < 40)

## File Naming Convention
Customer names are URL-encoded for safe file paths:
- Spaces → `%20`
- Slashes → `-`
- Ampersands → `%26`
- Parentheses → `%28` and `%29`
- Commas → `%2C`

Examples:
- `AT&T SERVICES, INC.` → `AT%26T%20SERVICES%2C%20INC..html`
- `Telefonica Germany GmbH & Co. OHG` → `Telefonica%20Germany%20GmbH%20%26%20Co.%20OHG.html`

## Access Instructions

### Open Index Page
```bash
open /Users/RAZER/Documents/projects/Skyvera/accounts/index.html
```

### Open Specific Account
```bash
# Example: Telstra account
open "/Users/RAZER/Documents/projects/Skyvera/accounts/Telstra%20Corporation%20Limited.html"
```

### Browse All Files
```bash
ls /Users/RAZER/Documents/projects/Skyvera/accounts/
```

## Technical Details

### Self-Contained HTML
- **No External Dependencies:** All CSS is inline
- **No JavaScript:** Pure HTML/CSS
- **Web Fonts:** Google Fonts (Cormorant Garamond + DM Sans)
- **No Build Process:** Open files directly in browser

### Generation Script
**Location:** `/Users/RAZER/Documents/projects/Skyvera/generate_all_accounts.py`

**Usage:**
```bash
python3 generate_all_accounts.py
```

**Data Sources:**
- `data/customers_cloudsense_all.json`
- `data/customers_kandy_all.json`
- `data/customers_stl_all.json`
- `data/customers_newnet_all.json`

## Integration Points

### Link from Main Dashboard
Add to Business_Analysis_Dashboard.html:
```html
<a href="accounts/index.html">View All Customer Accounts →</a>
```

### Link from BU Sections
Add BU-specific filters to index page or create BU-specific index pages.

## Next Steps (Optional)

1. **Add Charts:** Revenue trend charts per account
2. **Add OSINT Data:** Company info, news, financial data
3. **Add Contact Info:** Decision makers, sales contacts
4. **Add Notes:** Account manager notes, meeting history
5. **Add Risk Indicators:** Payment history, support tickets
6. **Export to PDF:** Print-friendly account summaries

## Notes

- **Zero-Revenue Accounts Excluded:** Accounts with $0 total revenue not included
- **Health Score Algorithm:** 
  - Base score: 100
  - -30 points for non-renewal
  - -20 points for decision required
  - -15 points if RR < 30% of total
  - -25 points if no subscriptions and no NRR
- **Subscription Validation:** Invalid subscription IDs (text strings) excluded from tables

---

Generated: February 10, 2026
Total Unique Customers: 117 (from 140 total records)
Total Files: 115 (114 account pages + 1 index)
Excluded: 23 zero-revenue accounts
Duplicate Names: 3 (overwrites occurred due to case differences)
