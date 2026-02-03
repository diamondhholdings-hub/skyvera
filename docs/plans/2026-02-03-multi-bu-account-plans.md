# Multi-BU Account Plans & Master Analytics Dashboard

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the account plan system to Kandy, STL, and NewNet business units, and create a master analytics dashboard with drill-down by BU and region.

**Architecture:** Replicate the CloudSense extraction/dashboard pipeline for each BU (Kandy, STL, NewNet), then build a master analytics dashboard using Chart.js that aggregates all BUs with filtering by business unit and region (Americas, EMEA, APAC). Use geographic inference from customer names and IP geolocation data where available.

**Tech Stack:** Python 3, openpyxl, HTML/CSS/JavaScript, Chart.js

---

## Task 1: Extract Kandy Customer Data

**Files:**
- Create: `scripts/extract_kandy_customers.py`
- Modify: None
- Output: `data/customers_kandy_top80.json`

**Step 1: Create Kandy extraction script**

```python
"""Extract top 80% Kandy customers by total revenue (RR+NRR)."""
import json
from openpyxl import load_workbook
from datetime import datetime
import re

def extract_kandy_rr():
    """Extract Kandy RR from RR Input sheet."""
    wb = load_workbook("2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx", data_only=True)
    ws = wb['RR Input']

    customers = {}

    for row in ws.iter_rows(min_row=11, values_only=True):
        company = row[0]  # Column A
        customer_name = row[1]  # Column B
        sub_id = row[3]  # Column D
        arr = row[6]  # Column G
        renewal_qtr = row[8]  # Column I
        will_renew = row[9]  # Column J
        upsell_pct = row[10]  # Column K
        projected_arr = row[11]  # Column L

        if company != 'Kandy' or not customer_name:
            continue

        if customer_name not in customers:
            customers[customer_name] = {
                'customer_name': customer_name,
                'rr': 0,
                'nrr': 0,
                'subscriptions': []
            }

        customers[customer_name]['rr'] += arr if arr else 0
        customers[customer_name]['subscriptions'].append({
            'sub_id': sub_id,
            'arr': arr,
            'renewal_qtr': renewal_qtr,
            'will_renew': will_renew,
            'projected_arr': projected_arr
        })

    return customers

def extract_kandy_nrr():
    """Extract Kandy NRR from NRR Input sheet."""
    wb = load_workbook("2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx", data_only=True)
    ws = wb['NRR Input']

    customers = {}

    for row in ws.iter_rows(min_row=6, values_only=True):
        customer_name = row[1]  # Column B
        class_col = row[2]  # Column C
        q1_26 = row[8] if len(row) > 8 else 0  # Column I
        q2_26 = row[9] if len(row) > 9 else 0  # Column J
        q3_26 = row[10] if len(row) > 10 else 0  # Column K
        q4_26 = row[11] if len(row) > 11 else 0  # Column L

        if not class_col or 'Kandy' not in class_col:
            continue

        # Handle "New Sales Ps - <Customer>" pattern
        match = re.search(r'<(.+?)>', customer_name) if customer_name else None
        if match:
            customer_name = match.group(1).strip()

        if not customer_name:
            continue

        fy26_nrr = (q1_26 or 0) + (q2_26 or 0) + (q3_26 or 0) + (q4_26 or 0)

        if customer_name not in customers:
            customers[customer_name] = 0
        customers[customer_name] += fy26_nrr

    return customers

def main():
    print("="*100)
    print("EXTRACTING KANDY CUSTOMER DATA")
    print("="*100)

    # Get RR data
    rr_customers = extract_kandy_rr()
    print(f"\nFound {len(rr_customers)} Kandy customers with RR")

    # Get NRR data
    nrr_data = extract_kandy_nrr()
    print(f"Found {len(nrr_data)} Kandy customers with NRR")

    # Merge RR and NRR
    all_customer_names = set(rr_customers.keys()) | set(nrr_data.keys())

    customers = []
    for name in all_customer_names:
        rr = rr_customers.get(name, {}).get('rr', 0)
        nrr = nrr_data.get(name, 0)
        total = rr + nrr

        customer = {
            'customer_name': name,
            'rr': rr,
            'nrr': nrr,
            'total': total,
            'subscriptions': rr_customers.get(name, {}).get('subscriptions', [])
        }
        customers.append(customer)

    # Sort by total revenue descending
    customers.sort(key=lambda x: x['total'], reverse=True)

    # Calculate top 80%
    total_revenue = sum(c['total'] for c in customers)
    cumulative = 0
    top_80_customers = []

    for customer in customers:
        cumulative += customer['total']
        top_80_customers.append(customer)
        if cumulative >= total_revenue * 0.8:
            break

    # Add rank and percentage
    for i, customer in enumerate(top_80_customers, 1):
        customer['rank'] = i
        customer['pct_of_total'] = (customer['total'] / total_revenue * 100) if total_revenue > 0 else 0

    # Save to JSON
    output = {
        'total_revenue': total_revenue,
        'top_80_count': len(top_80_customers),
        'top_80_revenue': sum(c['total'] for c in top_80_customers),
        'customers': top_80_customers
    }

    with open('data/customers_kandy_top80.json', 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n{'='*100}")
    print(f"✅ Extracted {len(top_80_customers)} Kandy customers (80% of ${total_revenue:,.0f})")
    print(f"📁 Saved to: data/customers_kandy_top80.json")
    print("="*100)

if __name__ == '__main__':
    main()
```

**Step 2: Run the extraction**

```bash
cd /Users/RAZER/Documents/projects/Skyvera
python3 scripts/extract_kandy_customers.py
```

Expected output: `data/customers_kandy_top80.json` created with Kandy customer list

**Step 3: Verify the output**

```bash
python3 -c "import json; d=json.load(open('data/customers_kandy_top80.json')); print(f\"Customers: {d['top_80_count']}, Revenue: \${d['total_revenue']:,.0f}\")"
```

Expected: Display count and total revenue

**Step 4: Commit**

```bash
git add scripts/extract_kandy_customers.py data/customers_kandy_top80.json
git commit -m "feat: extract Kandy top 80% customers by revenue

- Created extraction script for Kandy RR from RR Input sheet
- Extracted Kandy NRR from NRR Input sheet with class filtering
- Merged RR+NRR and calculated top 80% by total revenue
- Saved to data/customers_kandy_top80.json

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Extract STL Customer Data

**Files:**
- Create: `scripts/extract_stl_customers.py`
- Output: `data/customers_stl_top80.json`

**Step 1: Create STL extraction script**

Copy the Kandy script and modify for STL (change `company != 'Kandy'` to `company != 'STL'` and class filter to `'Stl'`)

```python
"""Extract top 80% STL customers by total revenue (RR+NRR)."""
# [Same structure as Kandy script, but filter for company='STL' and class contains 'Stl']
```

**Step 2: Run the extraction**

```bash
python3 scripts/extract_stl_customers.py
```

**Step 3: Commit**

```bash
git add scripts/extract_stl_customers.py data/customers_stl_top80.json
git commit -m "feat: extract STL top 80% customers"
```

---

## Task 3: Extract NewNet Customer Data

**Files:**
- Create: `scripts/extract_newnet_customers.py`
- Output: `data/customers_newnet_top80.json`

**Step 1: Create NewNet extraction script**

Copy the Kandy script and modify for NewNet (change company filter to `'NewNet'` and class filter to `'Newnet'`)

**Step 2: Run the extraction**

```bash
python3 scripts/extract_newnet_customers.py
```

**Step 3: Commit**

```bash
git add scripts/extract_newnet_customers.py data/customers_newnet_top80.json
git commit -m "feat: extract NewNet top 80% customers"
```

---

## Task 4: Generate Intelligence Prompts for All BUs

**Files:**
- Modify: `scripts/generate_intelligence_prompts.py` (if exists) OR Create new
- Output: `data/intelligence/prompts/*_kandy.txt`, `*_stl.txt`, `*_newnet.txt`

**Step 1: Create unified prompt generator**

```python
"""Generate intelligence prompts for all BU customers."""
import json
import os

def generate_prompt(customer, bu_name, bu_description):
    """Generate intelligence prompt for a customer."""
    return f"""Create a comprehensive B2B SaaS account plan for {customer['customer_name']} ({bu_name} customer #{customer['rank']} by revenue).

**CUSTOMER CONTEXT:**
- **Total Revenue:** ${customer['total']:,.0f} ({customer['pct_of_total']:.1f}% of {bu_name})
- **Recurring Revenue (RR/ARR):** ${customer['rr']:,.0f}
- **Non-Recurring Revenue (NRR/FY26):** ${customer['nrr']:,.0f}
- **Customer Rank:** #{customer['rank']} of top 80% customers
- **Active Subscriptions:** {len(customer['subscriptions'])}
- **Business Unit:** {bu_name} (part of Skyvera multi-BU SaaS company)

**WHAT {bu_name.upper()} PROVIDES:**
{bu_description}

[... rest of research requirements sections 1-10 ...]

**DELIVERABLE:** Comprehensive account plan intelligence brief ready for HTML dashboard population.
"""

def main():
    bu_configs = [
        {
            'name': 'Kandy',
            'file': 'data/customers_kandy_top80.json',
            'description': 'Kandy provides CPaaS (Communications Platform as a Service) and UCaaS (Unified Communications as a Service) solutions. It offers APIs for voice, video, messaging, and collaboration, enabling businesses to embed real-time communications into their applications and workflows.'
        },
        {
            'name': 'STL',
            'file': 'data/customers_stl_top80.json',
            'description': 'STL (Software Technology Labs) provides specialized software solutions and technology consulting services. Focus areas include custom software development, system integration, and technology transformation projects.'
        },
        {
            'name': 'NewNet',
            'file': 'data/customers_newnet_top80.json',
            'description': 'NewNet provides network management and telecommunications software solutions, specializing in network operations, service delivery platforms, and carrier-grade software for telecommunications providers.'
        }
    ]

    os.makedirs('data/intelligence/prompts', exist_ok=True)

    for bu in bu_configs:
        with open(bu['file'], 'r') as f:
            data = json.load(f)

        for customer in data['customers']:
            prompt = generate_prompt(customer, bu['name'], bu['description'])
            filename = f"{customer['customer_name'].replace('/', '-').replace(' ', '_')}_{bu['name'].lower()}.txt"
            filepath = f"data/intelligence/prompts/{filename}"

            with open(filepath, 'w') as f:
                f.write(prompt)

            print(f"Generated: {filename}")

    print("\n✅ All intelligence prompts generated")

if __name__ == '__main__':
    main()
```

**Step 2: Run prompt generation**

```bash
python3 scripts/generate_intelligence_prompts_all_bus.py
```

**Step 3: Commit**

```bash
git add scripts/generate_intelligence_prompts_all_bus.py data/intelligence/prompts/
git commit -m "feat: generate intelligence prompts for Kandy, STL, NewNet"
```

---

## Task 5: Create BU-Specific Dashboard Generators

**Files:**
- Create: `scripts/generate_dashboards_kandy.py`
- Create: `scripts/generate_dashboards_stl.py`
- Create: `scripts/generate_dashboards_newnet.py`
- Output: `output/kandy/*.html`, `output/stl/*.html`, `output/newnet/*.html`

**Step 1: Create Kandy dashboard generator**

Duplicate `scripts/generate_dashboards.py` and modify:
- Load from `data/customers_kandy_top80.json`
- Load news from `data/news/kandy/`
- Output to `output/kandy/`
- Update navigation to include BU selector dropdown
- Update branding/colors for Kandy

**Step 2: Run dashboard generation**

```bash
python3 scripts/generate_dashboards_kandy.py
python3 scripts/generate_dashboards_stl.py
python3 scripts/generate_dashboards_newnet.py
```

**Step 3: Commit**

```bash
git add scripts/generate_dashboards_*.py output/kandy/ output/stl/ output/newnet/
git commit -m "feat: generate dashboards for Kandy, STL, NewNet"
```

---

## Task 6: Create BU Index Pages

**Files:**
- Create: `scripts/generate_index_kandy.py`
- Create: `scripts/generate_index_stl.py`
- Create: `scripts/generate_index_newnet.py`
- Output: `output/kandy/index.html`, `output/stl/index.html`, `output/newnet/index.html`

**Step 1: Create BU index generators**

Duplicate `scripts/generate_index.py` for each BU with appropriate modifications

**Step 2: Run index generation**

```bash
python3 scripts/generate_index_kandy.py
python3 scripts/generate_index_stl.py
python3 scripts/generate_index_newnet.py
```

**Step 3: Commit**

```bash
git add scripts/generate_index_*.py output/*/index.html
git commit -m "feat: create BU-specific index pages"
```

---

## Task 7: Add Region Classification

**Files:**
- Create: `scripts/add_region_to_customers.py`
- Modify: All `data/customers_*_top80.json` files

**Step 1: Create region classifier**

```python
"""Add region classification to all customers."""
import json
import re

def classify_region(customer_name):
    """Classify customer by region based on name and known entities."""

    # EMEA indicators
    emea_keywords = [
        'UK', 'Limited', 'Ltd', 'plc', 'GmbH', 'AG', 'NV', 'SA', 'Oyj',
        'Telekom', 'Vodafone', 'Telefonica', 'Elisa', 'Luminus', 'Ziggo',
        'British', 'Virgin Media', 'A1 ', 'PostNL', 'Telecom', 'Orange'
    ]

    # APAC indicators
    apac_keywords = [
        'Pty', 'Sdn Bhd', 'Singapore', 'Telstra', 'StarHub', 'Maxis',
        'Australia', 'Japan', 'Korea', 'India', 'China', 'Asia'
    ]

    # Americas indicators
    americas_keywords = [
        'Inc.', 'LLC', 'Corp', 'AT&T', 'Comcast', 'Verizon', 'US',
        'Canada', 'America', 'Latin'
    ]

    name_upper = customer_name.upper()

    # Check for explicit matches
    if any(k.upper() in name_upper for k in emea_keywords):
        return 'EMEA'
    if any(k.upper() in name_upper for k in apac_keywords):
        return 'APAC'
    if any(k.upper() in name_upper for k in americas_keywords):
        return 'Americas'

    # Default to Americas if unclear
    return 'Americas'

def main():
    files = [
        'data/customers_top80.json',  # CloudSense
        'data/customers_kandy_top80.json',
        'data/customers_stl_top80.json',
        'data/customers_newnet_top80.json'
    ]

    for filepath in files:
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)

            for customer in data['customers']:
                customer['region'] = classify_region(customer['customer_name'])

            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)

            print(f"✅ Added regions to: {filepath}")
        except FileNotFoundError:
            print(f"⚠️  Skipped (not found): {filepath}")

if __name__ == '__main__':
    main()
```

**Step 2: Run region classification**

```bash
python3 scripts/add_region_to_customers.py
```

**Step 3: Commit**

```bash
git add scripts/add_region_to_customers.py data/customers_*.json
git commit -m "feat: add region classification to all customers"
```

---

## Task 8: Create Master Analytics Dashboard

**Files:**
- Create: `output/analytics.html`
- Uses: All `data/customers_*_top80.json` files

**Step 1: Create master analytics dashboard**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skyvera Master Analytics | Multi-BU Account Intelligence</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --ink: #1a1a1a;
            --paper: #fafaf8;
            --accent: #c84b31;
            --secondary: #2d4263;
            --muted: #8b8b8b;
            --border: #e8e6e1;
            --highlight: #ecdbba;
            --cloudsense: #2d4263;
            --kandy: #e65100;
            --stl: #1976d2;
            --newnet: #388e3c;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--paper);
            color: var(--ink);
            line-height: 1.6;
        }
        h1, h2 { font-family: 'Cormorant Garamond', serif; }

        .header {
            background: linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%);
            color: var(--paper);
            padding: 3rem 2rem;
            text-align: center;
        }

        .header h1 {
            font-size: 3rem;
            font-weight: 300;
            margin-bottom: 1rem;
        }

        .controls {
            background: white;
            padding: 2rem;
            margin: 2rem auto;
            max-width: 1400px;
            border: 1px solid var(--border);
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
        }

        .filter-group {
            flex: 1;
            min-width: 200px;
        }

        .filter-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            font-size: 0.85rem;
            color: var(--muted);
        }

        .filter-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 1rem;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            padding: 1.5rem;
            border: 1px solid var(--border);
            border-left: 4px solid var(--accent);
        }

        .stat-label {
            font-size: 0.85rem;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            color: var(--secondary);
        }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .chart-card {
            background: white;
            padding: 2rem;
            border: 1px solid var(--border);
        }

        .chart-card h2 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: var(--secondary);
        }

        .table-card {
            background: white;
            padding: 2rem;
            border: 1px solid var(--border);
            margin-bottom: 2rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            text-align: left;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }

        th {
            background: var(--highlight);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
        }

        .bu-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 3px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
        }

        .bu-cloudsense { background: var(--cloudsense); }
        .bu-kandy { background: var(--kandy); }
        .bu-stl { background: var(--stl); }
        .bu-newnet { background: var(--newnet); }
    </style>
</head>
<body>
    <div class="header">
        <h1>Skyvera Master Analytics</h1>
        <p>Multi-Business Unit Account Intelligence & Performance Dashboard</p>
    </div>

    <div class="controls">
        <div class="filter-group">
            <label>Business Unit</label>
            <select id="buFilter" onchange="applyFilters()">
                <option value="all">All Business Units</option>
                <option value="cloudsense">CloudSense</option>
                <option value="kandy">Kandy</option>
                <option value="stl">STL</option>
                <option value="newnet">NewNet</option>
            </select>
        </div>

        <div class="filter-group">
            <label>Region</label>
            <select id="regionFilter" onchange="applyFilters()">
                <option value="all">All Regions</option>
                <option value="Americas">Americas</option>
                <option value="EMEA">EMEA</option>
                <option value="APAC">APAC</option>
            </select>
        </div>
    </div>

    <div class="container">
        <div class="stats-grid" id="statsGrid">
            <!-- Populated by JavaScript -->
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h2>Revenue by Business Unit</h2>
                <canvas id="buRevenueChart"></canvas>
            </div>

            <div class="chart-card">
                <h2>Revenue by Region</h2>
                <canvas id="regionRevenueChart"></canvas>
            </div>

            <div class="chart-card">
                <h2>RR vs NRR Mix</h2>
                <canvas id="rrNrrChart"></canvas>
            </div>

            <div class="chart-card">
                <h2>Top 10 Customers</h2>
                <canvas id="topCustomersChart"></canvas>
            </div>
        </div>

        <div class="table-card">
            <h2>Customer Drill-Down</h2>
            <table id="customerTable">
                <!-- Populated by JavaScript -->
            </table>
        </div>
    </div>

    <script>
        // Load data from JSON files and render dashboard
        // [Detailed JavaScript implementation here]
    </script>
</body>
</html>
```

**Step 2: Test the analytics dashboard**

```bash
open output/analytics.html
```

**Step 3: Commit**

```bash
git add output/analytics.html
git commit -m "feat: create master analytics dashboard with multi-BU drill-down"
```

---

## Task 9: Update Navigation Links

**Files:**
- Modify: `output/index.html` (CloudSense)
- Modify: `output/kandy/index.html`
- Modify: `output/stl/index.html`
- Modify: `output/newnet/index.html`
- Modify: All individual customer dashboard HTML files

**Step 1: Add BU selector to global navigation**

Update global-nav section in all dashboard templates to include:

```html
<div class="global-nav">
    <a href="/output/analytics.html" class="global-nav-logo">SKYVERA</a>
    <select class="global-nav-select" onchange="window.location.href=this.value">
        <option value="">Select Business Unit...</option>
        <option value="/output/index.html">CloudSense</option>
        <option value="/output/kandy/index.html">Kandy</option>
        <option value="/output/stl/index.html">STL</option>
        <option value="/output/newnet/index.html">NewNet</option>
        <option value="/output/analytics.html">📊 Master Analytics</option>
    </select>
</div>
```

**Step 2: Re-generate all dashboards with updated navigation**

```bash
python3 scripts/generate_dashboards.py
python3 scripts/generate_dashboards_kandy.py
python3 scripts/generate_dashboards_stl.py
python3 scripts/generate_dashboards_newnet.py
python3 scripts/generate_index.py
python3 scripts/generate_index_kandy.py
python3 scripts/generate_index_stl.py
python3 scripts/generate_index_newnet.py
```

**Step 3: Commit**

```bash
git add output/
git commit -m "feat: add cross-BU navigation to all dashboards"
```

---

## Task 10: Create Master Update Script

**Files:**
- Create: `scripts/update_all_dashboards.sh`

**Step 1: Create master update script**

```bash
#!/bin/bash
# Master update script for all business units

set -e

REPO_DIR="/Users/RAZER/Documents/projects/Skyvera"
cd "$REPO_DIR"

echo "==================================================================="
echo "SKYVERA MASTER DASHBOARD UPDATE - $(date)"
echo "==================================================================="

echo ""
echo "1. Extracting customer data for all BUs..."
python3 scripts/extract_customer_data.py  # CloudSense
python3 scripts/extract_kandy_customers.py
python3 scripts/extract_stl_customers.py
python3 scripts/extract_newnet_customers.py

echo ""
echo "2. Adding region classifications..."
python3 scripts/add_region_to_customers.py

echo ""
echo "3. Fetching news for all BUs..."
python3 scripts/fetch_customer_news.py

echo ""
echo "4. Regenerating dashboards for all BUs..."
python3 scripts/generate_dashboards.py
python3 scripts/generate_dashboards_kandy.py
python3 scripts/generate_dashboards_stl.py
python3 scripts/generate_dashboards_newnet.py

echo ""
echo "5. Regenerating index pages..."
python3 scripts/generate_index.py
python3 scripts/generate_index_kandy.py
python3 scripts/generate_index_stl.py
python3 scripts/generate_index_newnet.py

echo ""
echo "6. Regenerating master analytics dashboard..."
python3 scripts/generate_analytics_dashboard.py

echo ""
echo "==================================================================="
echo "✅ Master dashboard update complete: $(date)"
echo "==================================================================="
```

**Step 2: Make executable and test**

```bash
chmod +x scripts/update_all_dashboards.sh
./scripts/update_all_dashboards.sh
```

**Step 3: Commit**

```bash
git add scripts/update_all_dashboards.sh
git commit -m "feat: create master update script for all BU dashboards"
```

---

## Completion Checklist

- [ ] Task 1: Extract Kandy customer data
- [ ] Task 2: Extract STL customer data
- [ ] Task 3: Extract NewNet customer data
- [ ] Task 4: Generate intelligence prompts for all BUs
- [ ] Task 5: Create BU-specific dashboard generators
- [ ] Task 6: Create BU index pages
- [ ] Task 7: Add region classification
- [ ] Task 8: Create master analytics dashboard
- [ ] Task 9: Update navigation links
- [ ] Task 10: Create master update script

---

## Testing & Validation

After completing all tasks:

1. Open `output/analytics.html` and verify:
   - All BUs appear in dropdown
   - All regions appear in dropdown
   - Charts update when filters change
   - Customer table drills down correctly

2. Test navigation flow:
   - CloudSense index → Customer → Analytics
   - Kandy index → Customer → Analytics
   - STL index → Customer → Analytics
   - NewNet index → Customer → Analytics

3. Verify data accuracy:
   - Compare customer counts with Excel
   - Verify revenue totals match source data
   - Check region classifications are reasonable
