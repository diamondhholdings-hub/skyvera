#!/usr/bin/env python3
"""
Create full tab-based account plan dashboards with intelligence data.
Organizes intelligence reports into proper tab structure with Overview, Executives, Org Structure, etc.
"""

import json
import os
import re
from pathlib import Path


def load_customers(bu='cloudsense'):
    """Load customer data for specified business unit."""
    if bu == 'cloudsense':
        filepath = 'data/customers_top80.json'
    elif bu == 'kandy':
        filepath = 'data/customers_kandy_top80.json'
    elif bu == 'stl':
        filepath = 'data/customers_stl_top80.json'
    elif bu == 'newnet':
        filepath = 'data/customers_newnet_top80.json'
    else:
        raise ValueError(f"Unknown BU: {bu}")

    with open(filepath, 'r') as f:
        return json.load(f)


def load_intelligence_data():
    """Load pregenerated intelligence HTML."""
    filepath = 'data/intelligence_html.json'
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return {}


def load_intelligence_markdown(customer_name):
    """Load raw markdown intelligence report with fuzzy matching."""
    customer_key = customer_name.replace('/', '-').replace(' ', '_')

    # Try exact match first
    filepath = f'data/intelligence/reports/{customer_key}.md'
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return f.read()

    # Try without suffix (Ltd, Inc, plc, etc.)
    base_name = customer_name
    for suffix in [' plc', ' Ltd', ' Limited', ', Inc.', ' Inc.', ' Inc', ' Sdn Bhd', ' AG.', ' AG', ' US', ' Pty Limited', ' Pty Ltd', ' BV', ' NV/SA', ' GmbH & Co. OHG', ' - Go Get', ' - Ges(a)']:
        if base_name.endswith(suffix):
            base_name = base_name[:-len(suffix)]
            break

    customer_key_clean = base_name.replace('/', '-').replace(' ', '_')
    filepath_clean = f'data/intelligence/reports/{customer_key_clean}.md'
    if os.path.exists(filepath_clean):
        with open(filepath_clean, 'r') as f:
            return f.read()

    # Normalize for matching (remove special chars, lowercase)
    def normalize(s):
        return s.lower().replace('&', '').replace(',', '').replace('.', '').replace(' ', '').replace('_', '').replace('-', '')

    base_normalized = normalize(base_name)

    # Try all files in directory for partial match
    reports_dir = Path('data/intelligence/reports')
    if reports_dir.exists():
        for report_file in reports_dir.glob('*.md'):
            file_normalized = normalize(report_file.stem)
            if file_normalized == base_normalized or (len(base_normalized) > 5 and file_normalized in base_normalized) or (len(file_normalized) > 5 and base_normalized in file_normalized):
                with open(report_file, 'r') as f:
                    return f.read()

    return None


def extract_section_from_markdown(md_content, section_name):
    """Extract a specific section from markdown content."""
    if not md_content:
        return None

    # Try exact match first
    pattern = rf'##\s+{re.escape(section_name)}\s*\n(.*?)(?=\n##\s+|\Z)'
    match = re.search(pattern, md_content, re.DOTALL | re.IGNORECASE)

    if match:
        return match.group(1).strip()

    # Try partial match (case insensitive, any text containing the search term)
    pattern = rf'##\s+[^\n]*{re.escape(section_name)}[^\n]*\n(.*?)(?=\n##\s+|\Z)'
    match = re.search(pattern, md_content, re.DOTALL | re.IGNORECASE)

    if match:
        return match.group(1).strip()

    return None


def generate_customer_dropdown(all_customers, current_customer, bu='cloudsense'):
    """Generate customer dropdown options."""
    if bu == 'cloudsense':
        prefix = ''
        return_path = 'index.html'
    else:
        prefix = ''
        return_path = f'{bu}/index.html'

    options = []
    for customer in all_customers:
        filename = customer['customer_name'].replace('/', '-').replace(' ', '_') + '.html'
        if bu != 'cloudsense':
            filename = f'{bu}/{filename}'
        selected = ' selected' if customer['customer_name'] == current_customer else ''
        options.append(
            f'<option value="{filename}"{selected}>#{customer["rank"]} - {customer["customer_name"]} (${customer["total"]/1000000:.2f}M)</option>'
        )
    return '\n'.join(options)


def create_tabbed_dashboard(customer, all_customers, intelligence_md, bu='cloudsense'):
    """Create full tabbed dashboard with intelligence data organized into sections."""
    customer_name = customer['customer_name']

    # Extract key metrics
    total_arr = customer['total']
    rr = customer['rr']
    nrr = customer['nrr']
    rank = customer['rank']
    pct_of_total = customer.get('pct_of_total', 0)

    # Extract intelligence sections with multiple fallback options
    exec_summary = (
        extract_section_from_markdown(intelligence_md, 'EXECUTIVE SUMMARY') or
        extract_section_from_markdown(intelligence_md, 'Executive Summary')
    )

    company_intel = (
        extract_section_from_markdown(intelligence_md, 'COMPANY INTELLIGENCE') or
        extract_section_from_markdown(intelligence_md, 'Company Intelligence') or
        extract_section_from_markdown(intelligence_md, 'COMPANY PROFILE') or
        extract_section_from_markdown(intelligence_md, '1. CUSTOMER PROFILE')  # Spotify format
    )

    executives = (
        extract_section_from_markdown(intelligence_md, 'EXECUTIVE LEADERSHIP') or
        extract_section_from_markdown(intelligence_md, 'KEY EXECUTIVES') or
        extract_section_from_markdown(intelligence_md, 'LEADERSHIP') or
        extract_section_from_markdown(intelligence_md, 'Key Executives') or
        extract_section_from_markdown(intelligence_md, 'COMPANY OVERVIEW')  # Some reports have leadership in company overview
    )

    org_structure = (
        extract_section_from_markdown(intelligence_md, 'ORGANIZATIONAL STRUCTURE') or
        extract_section_from_markdown(intelligence_md, '2. ORGANIZATIONAL STRUCTURE') or  # Spotify format
        extract_section_from_markdown(intelligence_md, 'ORG STRUCTURE') or
        extract_section_from_markdown(intelligence_md, 'ORGANIZATION') or
        extract_section_from_markdown(intelligence_md, 'CORPORATE STRUCTURE') or
        extract_section_from_markdown(intelligence_md, 'BUSINESS SEGMENTS') or
        extract_section_from_markdown(intelligence_md, 'KEY STAKEHOLDERS') or  # DPLAY
        extract_section_from_markdown(intelligence_md, 'COMPANY PROFILE') or  # DPLAY
        extract_section_from_markdown(intelligence_md, 'PARENT COMPANY') or  # DPLAY parent company info
        extract_section_from_markdown(intelligence_md, 'CORPORATE TRANSFORMATION') or  # DPLAY
        extract_section_from_markdown(intelligence_md, 'COMPANY OVERVIEW') or  # HCL, New Sales Ps, One Albania
        extract_section_from_markdown(intelligence_md, 'STRATEGIC CONTEXT') or
        extract_section_from_markdown(intelligence_md, 'STRATEGIC DIRECTION') or  # Thryv
        extract_section_from_markdown(intelligence_md, 'STRATEGIC INTELLIGENCE') or  # HCL
        extract_section_from_markdown(intelligence_md, 'STRATEGIC ANALYSIS') or  # New Sales Ps
        extract_section_from_markdown(intelligence_md, 'FINANCIAL ANALYSIS')  # Fallback for company context
    )

    pain_points = (
        extract_section_from_markdown(intelligence_md, 'PAIN POINTS & CHALLENGES') or
        extract_section_from_markdown(intelligence_md, 'PAIN POINTS') or
        extract_section_from_markdown(intelligence_md, 'PAIN POINT') or
        extract_section_from_markdown(intelligence_md, 'CHALLENGES') or
        extract_section_from_markdown(intelligence_md, 'STRATEGIC INITIATIVES') or
        extract_section_from_markdown(intelligence_md, 'RISK ASSESSMENT') or
        extract_section_from_markdown(intelligence_md, 'RISKS')
    )

    competitive = (
        extract_section_from_markdown(intelligence_md, 'COMPETITIVE LANDSCAPE') or
        extract_section_from_markdown(intelligence_md, '7. COMPETITIVE LANDSCAPE') or  # Spotify format
        extract_section_from_markdown(intelligence_md, 'COMPETITIVE') or
        extract_section_from_markdown(intelligence_md, 'COMPETITION') or
        extract_section_from_markdown(intelligence_md, 'COMPETITIVE THREAT') or  # HCL
        extract_section_from_markdown(intelligence_md, 'MARKET CONTEXT') or
        extract_section_from_markdown(intelligence_md, 'STRATEGIC CONTEXT') or
        extract_section_from_markdown(intelligence_md, 'STRATEGIC ANALYSIS') or  # New Sales Ps
        extract_section_from_markdown(intelligence_md, 'ROOT CAUSE ANALYSIS')  # One Albania (has competitive info in root cause)
    )

    opportunities = (
        extract_section_from_markdown(intelligence_md, 'OPPORTUNITY ANALYSIS') or
        extract_section_from_markdown(intelligence_md, 'OPPORTUNITY ASSESSMENT') or
        extract_section_from_markdown(intelligence_md, 'OPPORTUNITIES') or
        extract_section_from_markdown(intelligence_md, '6. EXPANSION OPPORTUNITIES') or  # Spotify format
        extract_section_from_markdown(intelligence_md, 'OPPORTUNIT') or
        extract_section_from_markdown(intelligence_md, 'GROWTH') or
        extract_section_from_markdown(intelligence_md, 'EXPANSION') or
        extract_section_from_markdown(intelligence_md, 'STRATEGIC INTELLIGENCE') or  # HCL (has opportunities in strategic intelligence)
        extract_section_from_markdown(intelligence_md, 'STRATEGIC OPTIONS')  # One Albania
    )

    action_plan = (
        extract_section_from_markdown(intelligence_md, 'ACCOUNT STRATEGY RECOMMENDATIONS') or
        extract_section_from_markdown(intelligence_md, 'RECOMMENDED ACTIONS') or
        extract_section_from_markdown(intelligence_md, 'RECOMMENDED ACTION PLAN') or  # One Albania
        extract_section_from_markdown(intelligence_md, 'ACCOUNT STRATEGY') or
        extract_section_from_markdown(intelligence_md, 'STRATEGY RECOMMENDATIONS') or
        extract_section_from_markdown(intelligence_md, 'ACTION PLAN') or
        extract_section_from_markdown(intelligence_md, '8. RELATIONSHIP STRATEGY') or  # Spotify
        extract_section_from_markdown(intelligence_md, 'RELATIONSHIP STRATEGY') or
        extract_section_from_markdown(intelligence_md, 'NEXT STEPS') or
        extract_section_from_markdown(intelligence_md, 'RECOMMENDATIONS')
    )

    # Convert markdown sections to HTML
    import markdown2

    def md_to_html(md_text):
        if not md_text:
            return '<p style="color: var(--muted); font-style: italic;">Intelligence data not available for this section.</p>'
        html = markdown2.markdown(md_text, extras=['tables', 'fenced-code-blocks'])
        # Add table class
        html = html.replace('<table>', '<table class="data-table">')
        return html

    exec_summary_html = md_to_html(exec_summary)
    company_intel_html = md_to_html(company_intel)
    executives_html = md_to_html(executives)
    org_structure_html = md_to_html(org_structure)
    pain_points_html = md_to_html(pain_points)
    competitive_html = md_to_html(competitive)
    opportunities_html = md_to_html(opportunities)
    action_plan_html = md_to_html(action_plan)

    # Determine BU name
    bu_name_map = {
        'cloudsense': 'CloudSense',
        'kandy': 'Kandy',
        'stl': 'STL',
        'newnet': 'NewNet'
    }
    bu_display = bu_name_map.get(bu, 'CloudSense')

    # Navigation paths
    if bu == 'cloudsense':
        back_link = 'index.html'
        index_path = 'index.html'
        kandy_path = 'kandy/index.html'
        stl_path = 'stl/index.html'
        newnet_path = 'newnet/index.html'
        analytics_path = 'analytics.html'
    else:
        back_link = f'../{bu}/index.html'
        index_path = '../index.html'
        kandy_path = '../kandy/index.html'
        stl_path = '../stl/index.html'
        newnet_path = '../newnet/index.html'
        analytics_path = '../analytics.html'

    # Build HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{customer_name} Account Plan | {bu_display} Strategic Analysis</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --ink: #1a1a1a;
            --paper: #fafaf8;
            --accent: #c84b31;
            --secondary: #2d4263;
            --muted: #8b8b8b;
            --border: #e8e6e1;
            --highlight: #ecdbba;
            --success: #4caf50;
            --warning: #ff9800;
            --critical: #e53935;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'DM Sans', sans-serif;
            background: var(--paper);
            color: var(--ink);
            line-height: 1.6;
        }}

        h1, h2, h3 {{
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            line-height: 1.2;
        }}

        h1 {{ font-size: 3.5rem; font-weight: 300; letter-spacing: -0.02em; }}
        h2 {{ font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--secondary); }}
        h3 {{ font-size: 1.25rem; margin-bottom: 1rem; }}

        /* Global Navigation */
        .global-nav {{
            background: var(--ink);
            color: var(--paper);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }}
        .global-nav-logo {{
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--accent);
            text-decoration: none;
        }}
        .global-nav-controls {{
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: center;
        }}
        .global-nav-bu-selector, .global-nav-select {{
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: white;
            cursor: pointer;
            min-width: 250px;
        }}

        /* Header */
        .header {{
            background: linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%);
            color: var(--paper);
            padding: 4rem 2rem 3rem;
            position: relative;
            overflow: hidden;
        }}

        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 60%;
            height: 100%;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)" /></svg>');
            opacity: 0.5;
        }}

        .header-content {{
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }}

        .subtitle {{
            font-size: 1.1rem;
            opacity: 0.85;
            margin-bottom: 2rem;
        }}

        .header-stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }}

        .stat-card {{
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            padding: 1.5rem;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}

        .stat-label {{
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.7;
            margin-bottom: 0.5rem;
        }}

        .stat-value {{
            font-size: 2rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
        }}

        .stat-change {{
            font-size: 0.9rem;
            margin-top: 0.5rem;
            opacity: 0.8;
        }}

        /* Navigation Tabs */
        .nav-tabs {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
            background: white;
            border-bottom: 2px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }}

        .nav-tabs-list {{
            display: flex;
            gap: 0;
            list-style: none;
            overflow-x: auto;
        }}

        .nav-tab {{
            padding: 1.25rem 2rem;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            white-space: nowrap;
            font-weight: 500;
            color: var(--muted);
        }}

        .nav-tab:hover {{
            color: var(--secondary);
            background: var(--highlight);
        }}

        .nav-tab.active {{
            color: var(--accent);
            border-bottom-color: var(--accent);
            background: var(--paper);
        }}

        /* Container */
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }}

        .tab-content {{
            display: none;
        }}

        .tab-content.active {{
            display: block;
            animation: fadeIn 0.5s ease;
        }}

        /* Cards */
        .card {{
            background: white;
            border: 1px solid var(--border);
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }}

        /* Tables */
        .data-table {{
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 1.5rem;
            font-size: 0.95rem;
        }}

        .data-table thead {{
            background: var(--secondary);
            color: white;
        }}

        .data-table th {{
            padding: 1rem 1.5rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .data-table td {{
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border);
        }}

        .data-table tbody tr:hover {{
            background: var(--highlight);
        }}

        /* Metrics Grid */
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }}

        .metric-box {{
            background: var(--highlight);
            padding: 1.5rem;
            border-left: 3px solid var(--accent);
        }}

        .metric-box .label {{
            font-size: 0.85rem;
            color: var(--muted);
            margin-bottom: 0.5rem;
            text-transform: uppercase;
        }}

        .metric-box .value {{
            font-size: 1.8rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            color: var(--secondary);
        }}

        /* Alert Banner */
        .alert-banner {{
            background: linear-gradient(135deg, var(--critical) 0%, #c62828 100%);
            color: white;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            border-left: 4px solid #8b1a1a;
            box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
        }}

        .alert-banner h3 {{
            color: white;
            margin-bottom: 0.5rem;
        }}

        /* Animations */
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(20px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        /* Footer */
        .footer {{
            background: var(--secondary);
            color: var(--paper);
            text-align: center;
            padding: 2rem;
            margin-top: 4rem;
        }}
    </style>
</head>
<body>
    <!-- Global Navigation -->
    <div class="global-nav">
        <a href="{analytics_path}" class="global-nav-logo">SKYVERA</a>
        <div class="global-nav-controls">
            <select class="global-nav-bu-selector" onchange="window.location.href=this.value">
                <option value="">Navigate to...</option>
                <option value="{index_path}" {"selected" if bu == "cloudsense" else ""}>CloudSense Overview</option>
                <option value="{kandy_path}" {"selected" if bu == "kandy" else ""}>Kandy Overview</option>
                <option value="{stl_path}" {"selected" if bu == "stl" else ""}>STL Overview</option>
                <option value="{newnet_path}" {"selected" if bu == "newnet" else ""}>NewNet Overview</option>
                <option value="{analytics_path}">📊 Master Analytics</option>
            </select>
            <select class="global-nav-select" onchange="window.location.href=this.value">
                <option value="">Select Customer Account...</option>
                {generate_customer_dropdown(all_customers, customer_name, bu)}
            </select>
        </div>
    </div>

    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <h1>{customer_name} Strategic Account Plan</h1>
            <div class="subtitle">{bu_display} Business Unit | Skyvera | Q1 2026</div>

            <div class="header-stats">
                <div class="stat-card">
                    <div class="stat-label">Total ARR</div>
                    <div class="stat-value">${total_arr/1000000:.2f}M</div>
                    <div class="stat-change">{pct_of_total:.1f}% of {bu_display}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Account Rank</div>
                    <div class="stat-value">#{rank}</div>
                    <div class="stat-change">{"Largest Customer" if rank == 1 else f"Top {rank} Customer"}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Recurring Revenue</div>
                    <div class="stat-value">${rr/1000000:.2f}M</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Non-Recurring</div>
                    <div class="stat-value">${nrr/1000000:.2f}M</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="nav-tabs">
        <ul class="nav-tabs-list">
            <li class="nav-tab active" onclick="showTab('overview')">📊 Overview</li>
            <li class="nav-tab" onclick="showTab('executives')">👔 Key Executives</li>
            <li class="nav-tab" onclick="showTab('org-chart')">🏢 Org Structure</li>
            <li class="nav-tab" onclick="showTab('pain-points')">💡 Pain Points</li>
            <li class="nav-tab" onclick="showTab('competitive')">⚔️ Competitive</li>
            <li class="nav-tab" onclick="showTab('opportunities')">🚀 Opportunities</li>
            <li class="nav-tab" onclick="showTab('action-plan')">📋 Action Plan</li>
        </ul>
    </div>

    <!-- Tab: Overview -->
    <div id="overview" class="tab-content active">
        <div class="container">
            <div class="card">
                <h2>Executive Summary</h2>
                {exec_summary_html}
            </div>

            <div class="card">
                <h2>Company Intelligence</h2>
                {company_intel_html}
            </div>
        </div>
    </div>

    <!-- Tab: Key Executives -->
    <div id="executives" class="tab-content">
        <div class="container">
            <div class="card">
                <h2>Key Executives & Decision Makers</h2>
                {executives_html}
            </div>
        </div>
    </div>

    <!-- Tab: Org Structure -->
    <div id="org-chart" class="tab-content">
        <div class="container">
            <div class="card">
                <h2>Organization Structure</h2>
                {org_structure_html}
            </div>
        </div>
    </div>

    <!-- Tab: Pain Points -->
    <div id="pain-points" class="tab-content">
        <div class="container">
            <div class="card">
                <h2>⚠️ Pain Points & Strategic Initiatives</h2>
                {pain_points_html}
            </div>
        </div>
    </div>

    <!-- Tab: Competitive -->
    <div id="competitive" class="tab-content">
        <div class="container">
            <div class="card">
                <h2>🏆 Competitive Landscape</h2>
                {competitive_html}
            </div>
        </div>
    </div>

    <!-- Tab: Opportunities -->
    <div id="opportunities" class="tab-content">
        <div class="container">
            <div class="card">
                <h2>🚀 Opportunities & Growth Potential</h2>
                {opportunities_html}
            </div>
        </div>
    </div>

    <!-- Tab: Action Plan -->
    <div id="action-plan" class="tab-content">
        <div class="container">
            <div class="card">
                <h2>📋 Account Strategy & Next Steps</h2>
                {action_plan_html}
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>© 2026 Skyvera | {bu_display} Business Unit | Account Plan Generated {customer_name}</p>
    </div>

    <script>
        function showTab(tabId) {{
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(tab => {{
                tab.classList.remove('active');
            }});

            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {{
                tab.classList.remove('active');
            }});

            // Show selected tab
            document.getElementById(tabId).classList.add('active');

            // Add active class to clicked tab
            event.target.classList.add('active');
        }}
    </script>
</body>
</html>
'''

    return html


def main():
    """Generate tabbed dashboards for all BUs."""

    bus = [
        ('cloudsense', 'output'),
        ('kandy', 'output/kandy'),
        ('stl', 'output/stl'),
        ('newnet', 'output/newnet')
    ]

    for bu, output_dir in bus:
        print(f"\n{'='*100}")
        print(f"GENERATING TABBED DASHBOARDS FOR {bu.upper()}")
        print(f"{'='*100}\n")

        # Load customers
        data = load_customers(bu)
        customers = data['customers']

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Generate dashboards
        for customer in customers:
            customer_name = customer['customer_name']
            customer_key = customer_name.replace('/', '-').replace(' ', '_')

            # Load intelligence markdown
            intelligence_md = load_intelligence_markdown(customer_name)

            if intelligence_md:
                print(f"✅ #{customer['rank']:2d} {customer_name:50s} → {customer_key}.html")

                # Generate tabbed dashboard
                html = create_tabbed_dashboard(customer, customers, intelligence_md, bu)

                # Save
                output_file = f"{output_dir}/{customer_key}.html"
                with open(output_file, 'w') as f:
                    f.write(html)
            else:
                print(f"⚠️  #{customer['rank']:2d} {customer_name:50s} → No intelligence data, skipping")

        print(f"\n✅ Generated tabbed dashboards for {bu}")


if __name__ == '__main__':
    main()
