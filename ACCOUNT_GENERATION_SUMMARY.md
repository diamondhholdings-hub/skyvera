# Account Plan Generation Summary

**Generated:** February 10, 2026
**Script:** `/Users/RAZER/Documents/projects/Skyvera/generate_accounts.py`
**Output Directory:** `/Users/RAZER/Documents/projects/Skyvera/accounts/`

## Overview

Successfully regenerated **140 complete account HTML pages** with full 7-tab structure following the Telstra reference template exactly.

## Statistics

- **Total Accounts:** 140 HTML files
- **Business Units:**
  - CloudSense: 68 customers
  - Kandy: 27 customers
  - STL: 21 customers
  - NewNet: 24 customers

### Health Score Distribution

- **At Risk (Red):** 32 accounts (22.9%)
  - Customers with will_renew = "No" or "No (SF)"
  - Critical alerts displayed
  - Risk mitigation action plans included

- **Healthy (Green):** 81 accounts (57.9%)
  - Customers with will_renew = "Yes"
  - Expansion-focused strategies
  - Reference development opportunities

- **TBD (Yellow):** 27 accounts (19.3%)
  - Customers with unclear renewal status
  - Renewal confirmation action plans
  - Stakeholder mapping priorities

## Complete 7-Tab Structure

Each account page includes:

### Tab 1: 📊 Overview
- **Critical Alerts** - Renewal risks and flags
- **Keys to Success** - Top 3 strategic priorities (tailored by health score)
- **Account Status** - Retention, ARR, contract terms
- **Product Usage & Adoption** - Platform utilization (with OSINT placeholders)
- **Key Metrics** - Subscriptions, ARR, renewals
- **Renewal Calendar** - Upcoming renewal timeline

### Tab 2: 👔 Key Executives
- **Executive Contacts Table** - Name, Title, Department, Phone, Email, LinkedIn
- **Placeholder:** "[OSINT NEEDED] Executive contact information to be gathered"
- **Action Alert:** OSINT research required for C-level mapping

### Tab 3: 🏢 Org Structure
- **Organization Structure** - Reporting hierarchy
- **Key Departments** - Leadership and platform usage
- **Placeholder:** "Organization structure mapping pending OSINT data collection"

### Tab 4: 💡 Pain Points
- **Business Challenges** - Strategic priorities
- **Technical Pain Points** - Platform requirements
- **Opportunity Areas** - Expansion possibilities
- **Placeholder:** "Pain point analysis pending OSINT research and stakeholder interviews"

### Tab 5: ⚔️ Competitive
- **Competitive Landscape** - Vendor analysis
- **Our Differentiation** - Positioning strategy
- **Competitive Threats** - Risk assessment
- **Placeholder:** "Competitive analysis pending OSINT intelligence gathering"

### Tab 6: 📋 Action Plan
- **Strategic Action Items** - Specific tasks with:
  - Action item description
  - Owner assignment
  - Due dates
  - Status tracking
- **Tactical Next Steps** - Immediate priorities
- **Actions tailored by health score:**
  - Red: Executive escalation, retention proposals
  - Green: Expansion proposals, reference programs
  - Yellow: Renewal discussions, stakeholder mapping

### Tab 7: 💰 Financial
- **Revenue Breakdown** - RR vs NRR with metrics cards
- **Subscription Details** - Full subscription table with renewal data
- **ARR Trends** - Interactive Chart.js visualization
- **Expansion Opportunities** - Pipeline analysis (placeholder)
- **Contract Value Analysis** - Current vs potential

## Design & Styling

- **Fonts:** Cormorant Garamond (headings) + DM Sans (body)
- **Theme:** Editorial/executive style matching Telstra reference
- **Color Scheme:**
  - Ink: #1a1a1a
  - Paper: #fafaf8
  - Accent: #c84b31
  - Secondary: #2d4263
  - Success: #4caf50
  - Warning: #ff9800
  - Critical: #e53935
- **Self-contained:** All CSS inline, Chart.js CDN
- **Responsive:** Mobile-friendly design
- **Interactive:** Tab navigation, charts

## Key Features

1. **Dynamic Health Scoring**
   - Automatic calculation based on will_renew status
   - Color-coded indicators (red/yellow/green)
   - Context-aware action plans

2. **Duplicate Handling**
   - Case-insensitive filename collision detection
   - Rank and BU appended to duplicates
   - Examples:
     - British_Telecommunications_plc_rank7_CloudSense_Account_Plan.html
     - British_Telecommunications_Plc_rank58_CloudSense_Account_Plan.html

3. **Complete Financial Data**
   - RR (Recurring Revenue) - quarterly
   - NRR (Non-Recurring Revenue) - quarterly
   - ARR (Annual Recurring Revenue) - calculated
   - Subscription-level detail with renewal quarters

4. **OSINT Integration Ready**
   - Clear placeholders marked "[OSINT NEEDED]"
   - Structured sections for data population
   - Task 8 pending: "Fill account plans with OSINT data from connectors"

## Data Sources

All customer data loaded from:
- `/Users/RAZER/Documents/projects/Skyvera/data/customers_cloudsense_all.json`
- `/Users/RAZER/Documents/projects/Skyvera/data/customers_kandy_all.json`
- `/Users/RAZER/Documents/projects/Skyvera/data/customers_stl_all.json`
- `/Users/RAZER/Documents/projects/Skyvera/data/customers_newnet_all.json`

## Notable At-Risk Accounts

Key accounts requiring immediate attention:

**CloudSense:**
- British Telecommunications plc (Rank 7) - $1.4M ARR - Q1'26 renewal - "No (SF)"
- Thryv Australia Pty Ltd (Rank 19) - $568K ARR - Q1'26 renewal - "No"
- CoreSite (Rank 23) - $456K ARR - Q3'26 renewal - "No"
- DPG Media BV (Rank 28) - $359K ARR - Q3'26 renewal - "No"
- PropertyGuru Pte Ltd (Rank 36) - $262K ARR - Q2'26 renewal - "No"
- Hubexo South UK Ltd (Rank 44) - $173K ARR - Q3'26 renewal - "No"
- Ntirety (Hosting.com) (Rank 49) - $135K ARR - Q4'25 renewal - "No"

**Kandy:**
- COMPORIUM, INC. (Rank 6) - $128K ARR - Q1'26 renewal - "No" (2 subscriptions)
- Juxto - Ontario (Rank 11) - $49K ARR - Q1'26 renewal - "No"
- HERTZ EUROPE LIMITED (Rank 13) - $47K ARR - Q1'26 renewal - "No"
- VODAFONE FIJI LIMITED (Rank 19) - $11K ARR - Q1'26 renewal - "No"

**STL:**
- One Albania (Rank 1) - $1.6M ARR - Q4'26 renewal - "No" (CRITICAL - largest STL customer)
- Bharti Airtel Limited - Mumbai (Rank 11) - $63K ARR - multiple "No"
- Bharti Airtel Limited - Gurgaon (Rank 16) - $33K ARR - Q1'26 renewal - "No"
- Bharti Airtel Limited - Chennai (Rank 15) - $34K ARR - Q4'26 renewal - "No"
- Wipro Ltd. (Rank 18) - $24K ARR - Q2'26 renewal - "No"
- Mavenir Systems (Rank 19) - $22K ARR - Q2'26 renewal - "No"

**NewNet:**
- HCL TECHNOLOGIES UK LIMITED (Rank 2) - $2.1M ARR - Q2'26 renewal - "No" (CRITICAL - 2nd largest NewNet)
- Pelephone Communications Ltd (Rank 12) - $129K ARR - Q1'26 renewal - "No (SF)"
- Taifon Computer Co Ltd (Rank 22) - $32K ARR - Q2'26 renewal - "No"

## Next Steps

1. **OSINT Data Population** (Task 8)
   - Gather executive contacts via LinkedIn, company websites
   - Map organization structures
   - Document pain points through stakeholder interviews
   - Analyze competitive landscape

2. **Account Review Prioritization**
   - Focus on 32 at-risk accounts first
   - Schedule executive engagement calls for Q1'26 renewals
   - Develop retention proposals for high-value accounts

3. **Expansion Opportunities**
   - Identify upsell potential in 81 healthy accounts
   - Document reference program candidates
   - Plan QBRs for strategic accounts

## Files Generated

140 HTML files in `/Users/RAZER/Documents/projects/Skyvera/accounts/` including:

- Liquid_Telecom_Account_Plan.html
- Telefonica_UK_Limited_Account_Plan.html
- Telstra_Corporation_Limited_Account_Plan.html
- EMIRCOM_Account_Plan.html (largest Kandy customer)
- One_Albania_Account_Plan.html (largest STL customer - AT RISK)
- NS_Solutions_Corporation_rank1_NewNet_Account_Plan.html (largest NewNet customer)
- HCL_TECHNOLOGIES_UK_LIMITED_Account_Plan.html (2nd largest NewNet - AT RISK)
- British_Telecommunications_plc_rank7_CloudSense_Account_Plan.html (AT RISK)
- ... and 133 more

All files ready for browser viewing and OSINT data population.
