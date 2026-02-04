#!/usr/bin/env python3
"""Generate tabbed account plan dashboards using the template structure."""

import json
import os
from datetime import datetime

def load_customers(bu):
    """Load customers for a specific BU."""
    bu_files = {
        'CloudSense': 'data/customers_cloudsense_all.json',
        'Kandy': 'data/customers_kandy_all.json',
        'STL': 'data/customers_stl_all.json',
        'NewNet': 'data/customers_newnet_all.json'
    }

    with open(bu_files[bu], 'r') as f:
        return json.load(f)['customers']

def load_intelligence_data():
    """Load pregenerated intelligence HTML."""
    filepath = 'data/intelligence_html.json'
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return {}

def load_intelligence_report(customer_name):
    """Load raw markdown intelligence report."""
    filename = f"{customer_name.replace('/', '-').replace(' ', '_')}.md"
    filepath = f"data/intelligence/reports/{filename}"

    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return f.read()
    return None

def parse_action_items(report_text):
    """Extract top 3 action items from intelligence report."""
    if not report_text:
        return []

    actions = []
    import re

    # Parse immediate actions (0-30 days)
    immediate_section = re.search(r'### Immediate Actions.*?\n\n(.*?)(?=\n### |\n## |\Z)', report_text, re.DOTALL)
    if immediate_section:
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\*.*?\|', immediate_section.group(1))
        for priority, action in rows[:3]:
            clean_action = action.strip().replace('**', '')
            actions.append({'priority': int(priority), 'action': clean_action})

    # If we need more, get from short-term
    if len(actions) < 3:
        shortterm_section = re.search(r'### Short-Term Actions.*?\n\n(.*?)(?=\n### |\n## |\Z)', report_text, re.DOTALL)
        if shortterm_section:
            rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\*.*?\|', shortterm_section.group(1))
            for priority, action in rows[:3-len(actions)]:
                clean_action = action.strip().replace('**', '')
                actions.append({'priority': int(priority), 'action': clean_action})

    return actions[:3]

def parse_critical_alerts(report_text):
    """Extract critical risks from intelligence report."""
    if not report_text:
        return []

    alerts = []
    import re

    # Look for "CAUTION:" or "CRITICAL" in key findings
    findings = re.findall(r'\d+\.\s+\*\*(CAUTION|CRITICAL|RISK):\*\*\s+(.+?)(?=\n\d+\.|\n\n|\Z)', report_text, re.DOTALL)
    for severity, text in findings[:2]:
        alerts.append({'severity': severity, 'text': text.strip()})

    # Also check risk table for CRITICAL severity
    risk_matches = re.findall(r'\|\s+\*\*(.+?)\*\*\s+\|[^\|]+\|[^\|]+\|\s+(Critical|HIGH)\s+\|', report_text, re.IGNORECASE)
    for risk, severity in risk_matches[:1]:
        if not any(r['text'].lower().find(risk.lower()[:20]) >= 0 for r in alerts):
            alerts.append({'severity': 'CRITICAL', 'text': f"{risk} identified as critical risk"})

    return alerts[:2]

def get_customer_intelligence(customer_name, intelligence_data):
    """Get intelligence HTML for customer."""
    customer_key = customer_name.replace('/', '-').replace(' ', '_')
    if customer_key in intelligence_data:
        return intelligence_data[customer_key]

    # Try without underscores
    customer_key_no_underscore = customer_name.replace('/', ' ').replace('  ', ' ')
    for key in intelligence_data.keys():
        if key.replace('_', ' ').lower() == customer_key_no_underscore.lower():
            return intelligence_data[key]

    return None

def generate_customer_dropdown(all_customers, current_customer_name, bu):
    """Generate customer dropdown options."""
    options = []
    for customer in all_customers:
        filename = customer['customer_name'].replace('/', '-').replace(' ', '_') + '.html'
        selected = ' selected' if customer['customer_name'] == current_customer_name else ''
        options.append(
            f'<option value="{filename}"{selected}>#{customer["rank"]} - {customer["customer_name"]} (${customer["total"]/1000000:.2f}M)</option>'
        )
    return '\n'.join(options)

def create_tabbed_dashboard(customer, all_customers, bu_name, intelligence_data):
    """Create a full tabbed dashboard for a customer."""
    customer_name = customer['customer_name']

    # Load intelligence
    intelligence_html = get_customer_intelligence(customer_name, intelligence_data)
    intelligence_report = load_intelligence_report(customer_name)
    action_items = parse_action_items(intelligence_report) if intelligence_report else []
    critical_alerts = parse_critical_alerts(intelligence_report) if intelligence_report else []

    has_intelligence = intelligence_html is not None

    # Generate alert banners HTML
    alerts_html = ''
    for alert in critical_alerts:
        alert_title = alert["text"][:80] + ('...' if len(alert["text"]) > 80 else '')
        alerts_html += f'''
        <div class="alert-banner">
            <h3>🚨 {alert["severity"].upper()}: {alert_title}</h3>
            <p>{alert["text"]}</p>
        </div>
        '''

    # Generate keys to success HTML
    keys_html = ''
    if action_items:
        priority_cards = ''
        for action in action_items:
            priority_cards += f'''
                <div class="priority-card">
                    <div class="priority-label">Priority #{action["priority"]}</div>
                    <div class="priority-action">{action["action"]}</div>
                </div>
            '''

        keys_html = f'''
        <div class="keys-to-success">
            <h2>🎯 Keys to Success in Next 90 Days</h2>
            <div class="priority-grid">
                {priority_cards}
            </div>
        </div>
        '''

    # Generate the full HTML (continues in next message due to length)
    html = generate_html_structure(
        customer, all_customers, bu_name, intelligence_html,
        alerts_html, keys_html, has_intelligence
    )

    return html

def generate_html_structure(customer, all_customers, bu_name, intelligence_html, alerts_html, keys_html, has_intelligence):
    """Generate the complete HTML structure with all tabs."""
    customer_name = customer['customer_name']

    # Calculate percentages
    rr_pct = (customer['rr']/customer['total']*100) if customer['total'] > 0 else 0
    nrr_pct = (customer['nrr']/customer['total']*100) if customer['total'] > 0 else 0

    # Pending notice for tabs without intelligence
    pending_notice = f'''
    <div class="pending-notice">
        <h2 style="margin-bottom: 1rem;">⏳ Intelligence In Progress</h2>
        <p>Detailed analysis for this section will be available once customer intelligence research is complete.</p>
        <p style="margin-top: 1rem;"><strong>Status:</strong> Awaiting customer-intelligence-analyst research for {customer_name}</p>
    </div>
    '''

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{customer_name} Account Plan | Skyvera {bu_name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    {generate_css()}
</head>
<body>
    {generate_global_nav(all_customers, customer_name, bu_name)}
    {generate_header(customer, bu_name)}
    {generate_tab_nav()}

    <!-- Tab: Overview -->
    <div id="overview" class="tab-content active">
        <div class="container">
            {alerts_html}
            {keys_html}

            {intelligence_html if has_intelligence else pending_notice}

            <div class="card">
                <h2>Account Overview</h2>
                <div class="metrics-grid">
                    <div class="metric-box">
                        <div class="label">Business Unit</div>
                        <div class="value" style="font-size: 1.2rem;">{bu_name}</div>
                    </div>
                    <div class="metric-box">
                        <div class="label">Active Subscriptions</div>
                        <div class="value">{len(customer['subscriptions'])}</div>
                    </div>
                    <div class="metric-box">
                        <div class="label">% of {bu_name}</div>
                        <div class="value">{customer['pct_of_total']:.1f}%</div>
                    </div>
                    <div class="metric-box">
                        <div class="label">Revenue Mix</div>
                        <div class="value" style="font-size: 1rem;">
                            {rr_pct:.0f}% RR / {nrr_pct:.0f}% NRR
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Revenue Breakdown</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="text-align: left; padding: 1rem;">Component</th>
                        <th style="text-align: right; padding: 1rem;">Amount</th>
                        <th style="text-align: right; padding: 1rem;">% of Total</th>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 1rem;"><strong>Recurring Revenue (ARR)</strong></td>
                        <td style="text-align: right; padding: 1rem;">${customer['rr']:,.0f}</td>
                        <td style="text-align: right; padding: 1rem;">{rr_pct:.1f}%</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 1rem;"><strong>Non-Recurring Revenue (FY26)</strong></td>
                        <td style="text-align: right; padding: 1rem;">${customer['nrr']:,.0f}</td>
                        <td style="text-align: right; padding: 1rem;">{nrr_pct:.1f}%</td>
                    </tr>
                    <tr style="background: var(--highlight); font-weight: 700;">
                        <td style="padding: 1rem;"><strong>TOTAL REVENUE</strong></td>
                        <td style="text-align: right; padding: 1rem;">${customer['total']:,.0f}</td>
                        <td style="text-align: right; padding: 1rem;">100.0%</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>

    <!-- Remaining tabs with pending notices -->
    {generate_remaining_tabs(customer_name, has_intelligence)}

    {generate_footer(customer_name, bu_name)}
    {generate_javascript()}
</body>
</html>"""

    return html

# CSS, JavaScript, and component generators continue in next function calls...

def generate_css():
    """Generate complete CSS for the dashboard."""
    return """
    <style>
        :root {
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
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DM Sans', sans-serif;
            background: var(--paper);
            color: var(--ink);
            line-height: 1.6;
        }

        h1, h2, h3 {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            line-height: 1.2;
        }

        h1 { font-size: 3.5rem; font-weight: 300; letter-spacing: -0.02em; }
        h2 { font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--secondary); }
        h3 { font-size: 1.25rem; margin-bottom: 1rem; }

        /* Global Nav */
        .global-nav {
            background: var(--ink);
            color: var(--paper);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .global-nav-logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--accent);
            text-decoration: none;
        }

        .global-nav-controls {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: center;
        }

        .global-nav-bu-selector, .global-nav-select {
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: white;
            cursor: pointer;
        }

        .global-nav-bu-selector { min-width: 250px; }
        .global-nav-select { min-width: 400px; }

        /* Header */
        .header {
            background: linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%);
            color: var(--paper);
            padding: 4rem 2rem 3rem;
            position: relative;
            overflow: hidden;
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        .subtitle {
            font-size: 1.1rem;
            opacity: 0.85;
            margin-bottom: 2rem;
        }

        .header-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            padding: 1.5rem;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-label {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.7;
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
        }

        /* Navigation Tabs */
        .nav-tabs {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
            background: white;
            border-bottom: 2px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .nav-tabs-list {
            display: flex;
            gap: 0;
            list-style: none;
            overflow-x: auto;
        }

        .nav-tab {
            padding: 1.25rem 2rem;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            white-space: nowrap;
            font-weight: 500;
            color: var(--muted);
        }

        .nav-tab:hover {
            color: var(--secondary);
            background: var(--highlight);
        }

        .nav-tab.active {
            color: var(--accent);
            border-bottom-color: var(--accent);
            background: rgba(200, 75, 49, 0.05);
        }

        /* Tab Content */
        .tab-content {
            display: none;
            animation: fadeIn 0.3s ease;
        }

        .tab-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Container */
        .container {
            max-width: 1400px;
            margin: 3rem auto;
            padding: 0 2rem;
        }

        /* Cards */
        .card {
            background: white;
            border: 1px solid var(--border);
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        /* Metrics Grid */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .metric-box {
            background: var(--highlight);
            padding: 1.5rem;
            border-left: 3px solid var(--accent);
        }

        .metric-box .label {
            font-size: 0.85rem;
            color: var(--muted);
            margin-bottom: 0.5rem;
            text-transform: uppercase;
        }

        .metric-box .value {
            font-size: 1.8rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            color: var(--secondary);
        }

        /* Alert Banner */
        .alert-banner {
            background: linear-gradient(135deg, var(--critical) 0%, #c62828 100%);
            color: white;
            padding: 1.5rem 2rem;
            margin: 0 0 2rem;
            border-left: 4px solid #8b1a1a;
            box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
            border-radius: 4px;
        }

        .alert-banner h3 {
            color: white;
            margin-bottom: 0.75rem;
            font-size: 1.3rem;
        }

        .alert-banner p {
            margin: 0.5rem 0 0;
            line-height: 1.6;
            opacity: 0.95;
        }

        /* Keys to Success */
        .keys-to-success {
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%);
            border: 1px solid rgba(76, 175, 80, 0.2);
            padding: 2rem;
            margin: 0 0 2rem;
            border-radius: 4px;
        }

        .keys-to-success h2 {
            color: #2e7d32;
            margin-bottom: 1.5rem;
        }

        .priority-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        }

        .priority-card {
            background: white;
            padding: 1.5rem;
            border-left: 4px solid #4caf50;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-radius: 4px;
        }

        .priority-card .priority-label {
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #4caf50;
            margin-bottom: 0.75rem;
            letter-spacing: 0.5px;
        }

        .priority-card .priority-action {
            font-size: 1.15rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            color: var(--secondary);
            line-height: 1.4;
        }

        /* Pending Notice */
        .pending-notice {
            background: rgba(255, 152, 0, 0.1);
            border-left: 4px solid #ff9800;
            padding: 2rem;
            margin: 2rem 0;
            border-radius: 4px;
        }

        /* Footer */
        .footer {
            background: var(--secondary);
            color: var(--paper);
            text-align: center;
            padding: 2rem;
            margin-top: 4rem;
        }
    </style>
    """

def generate_global_nav(all_customers, current_customer, bu_name):
    """Generate global navigation bar."""
    return f"""
    <div class="global-nav">
        <a href="../index.html" class="global-nav-logo">SKYVERA</a>
        <div class="global-nav-controls">
            <select class="global-nav-bu-selector" onchange="window.location.href=this.value">
                <option value="">Navigate to...</option>
                <option value="../index.html"{' selected' if bu_name == 'CloudSense' else ''}>CloudSense Overview</option>
                <option value="../kandy/index.html"{' selected' if bu_name == 'Kandy' else ''}>Kandy Overview</option>
                <option value="../stl/index.html"{' selected' if bu_name == 'STL' else ''}>STL Overview</option>
                <option value="../newnet/index.html"{' selected' if bu_name == 'NewNet' else ''}>NewNet Overview</option>
                <option value="../analytics.html">📊 Master Analytics</option>
            </select>
            <select class="global-nav-select" onchange="window.location.href=this.value">
                <option value="">Select Customer Account...</option>
                {generate_customer_dropdown(all_customers, current_customer, bu_name)}
            </select>
        </div>
    </div>
    """

def generate_header(customer, bu_name):
    """Generate dashboard header with stats."""
    return f"""
    <div class="header">
        <div class="header-content">
            <h1>{customer['customer_name']}</h1>
            <div class="subtitle">Strategic Account Plan | {bu_name} Business Unit | Q1 2026</div>

            <div class="header-stats">
                <div class="stat-card">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">${customer['total']/1000000:.2f}M</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Recurring Revenue</div>
                    <div class="stat-value">${customer['rr']/1000000:.2f}M</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Non-Recurring Revenue</div>
                    <div class="stat-value">${customer['nrr']/1000000:.2f}M</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Customer Rank</div>
                    <div class="stat-value">#{customer['rank']}</div>
                </div>
            </div>
        </div>
    </div>
    """

def generate_tab_nav():
    """Generate tab navigation bar."""
    return """
    <div class="nav-tabs">
        <ul class="nav-tabs-list">
            <li class="nav-tab active" onclick="showTab('overview')">📊 Overview</li>
            <li class="nav-tab" onclick="showTab('executives')">👔 Key Executives</li>
            <li class="nav-tab" onclick="showTab('org-chart')">🏢 Org Structure</li>
            <li class="nav-tab" onclick="showTab('pain-points')">💡 Pain Points</li>
            <li class="nav-tab" onclick="showTab('competitive')">⚔️ Competitive</li>
            <li class="nav-tab" onclick="showTab('action-plan')">📋 Action Plan</li>
            <li class="nav-tab" onclick="showTab('financial')">💰 Financial</li>
        </ul>
    </div>
    """

def generate_remaining_tabs(customer_name, has_intelligence):
    """Generate the remaining 6 tab sections."""
    pending_notice = f'''
    <div class="pending-notice">
        <h2 style="margin-bottom: 1rem;">⏳ Intelligence In Progress</h2>
        <p>Detailed analysis for this section will be available once customer intelligence research is complete.</p>
        <p style="margin-top: 1rem;"><strong>Status:</strong> Awaiting customer-intelligence-analyst research for {customer_name}</p>
    </div>
    '''

    return f"""
    <!-- Tab: Key Executives -->
    <div id="executives" class="tab-content">
        <div class="container">
            {pending_notice}
        </div>
    </div>

    <!-- Tab: Org Structure -->
    <div id="org-chart" class="tab-content">
        <div class="container">
            {pending_notice}
        </div>
    </div>

    <!-- Tab: Pain Points -->
    <div id="pain-points" class="tab-content">
        <div class="container">
            {pending_notice}
        </div>
    </div>

    <!-- Tab: Competitive -->
    <div id="competitive" class="tab-content">
        <div class="container">
            {pending_notice}
        </div>
    </div>

    <!-- Tab: Action Plan -->
    <div id="action-plan" class="tab-content">
        <div class="container">
            {pending_notice}
        </div>
    </div>

    <!-- Tab: Financial -->
    <div id="financial" class="tab-content">
        <div class="container">
            {pending_notice}
        </div>
    </div>
    """

def generate_footer(customer_name, bu_name):
    """Generate footer."""
    return f"""
    <div class="footer">
        <p><strong>{customer_name} Strategic Account Plan</strong> | {bu_name} Business Unit | Skyvera</p>
        <p style="margin-top: 0.5rem;">Generated: {datetime.now().strftime('%B %d, %Y')} | Confidential - Internal Use Only</p>
    </div>
    """

def generate_javascript():
    """Generate JavaScript for tab switching."""
    return """
    <script>
        function showTab(tabId) {
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // Remove active class from all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab content
            document.getElementById(tabId).classList.add('active');

            // Add active class to clicked nav tab
            event.target.classList.add('active');
        }
    </script>
    """

def main():
    """Main execution function."""
    print("="*100)
    print("GENERATING TABBED ACCOUNT PLAN DASHBOARDS")
    print("="*100)

    bus = {
        'CloudSense': 'output',
        'Kandy': 'output/kandy',
        'STL': 'output/stl',
        'NewNet': 'output/newnet'
    }

    intelligence_data = load_intelligence_data()
    print(f"Loaded intelligence for {len(intelligence_data)} customers\n")

    total_generated = 0

    for bu_name, output_dir in bus.items():
        print(f"\n{bu_name}:")
        print("-" * 80)

        customers = load_customers(bu_name)
        os.makedirs(output_dir, exist_ok=True)

        for customer in customers:
            customer_name = customer['customer_name']
            filename = customer_name.replace('/', '-').replace(' ', '_') + '.html'
            filepath = f"{output_dir}/{filename}"

            html = create_tabbed_dashboard(customer, customers, bu_name, intelligence_data)

            with open(filepath, 'w') as f:
                f.write(html)

            has_intel = '📊' if get_customer_intelligence(customer_name, intelligence_data) else '  '
            print(f"  #{customer['rank']:<3} {has_intel} {customer_name[:60]:<60} → {filename}")
            total_generated += 1

        print(f"  ✅ Generated {len(customers)} {bu_name} dashboards")

    print("\n" + "="*100)
    print(f"✅ Generated {total_generated} tabbed account plan dashboards")
    print("="*100)

if __name__ == '__main__':
    main()
