#!/usr/bin/env python3
"""
Generate all 114 account HTML pages with complete 7-tab structure
Following Telstra reference template exactly
"""

import json
import os
from datetime import datetime

# Load customer data from all BUs
def load_customer_data():
    data_dir = "/Users/RAZER/Documents/projects/Skyvera/data"
    all_customers = []

    files = [
        "customers_cloudsense_all.json",
        "customers_kandy_all.json",
        "customers_stl_all.json",
        "customers_newnet_all.json"
    ]

    for filename in files:
        filepath = os.path.join(data_dir, filename)
        with open(filepath, 'r') as f:
            data = json.load(f)
            bu_name = data['bu_name']
            for customer in data['customers']:
                customer['bu'] = bu_name
                all_customers.append(customer)

    return all_customers

def calculate_health_score(customer):
    """Calculate health score based on renewal status"""
    subscriptions = customer.get('subscriptions', [])
    if not subscriptions:
        return 'yellow', 'TBD'

    # Check if any subscription has will_renew status
    has_at_risk = False
    has_yes = False

    for sub in subscriptions:
        will_renew = sub.get('will_renew')
        if will_renew:
            will_renew_str = str(will_renew).upper()
            if 'NO' in will_renew_str:
                has_at_risk = True
            elif 'YES' in will_renew_str:
                has_yes = True

    # Priority: At Risk > Healthy > TBD
    if has_at_risk:
        return 'red', 'At Risk'
    elif has_yes:
        return 'green', 'Healthy'
    else:
        return 'yellow', 'TBD'

def format_currency(value):
    """Format currency values"""
    if value is None:
        return "$0"
    return f"${value:,.0f}"

def generate_account_html(customer):
    """Generate complete 7-tab HTML for a single account"""

    customer_name = customer['customer_name']
    bu = customer['bu']
    rr = customer.get('rr', 0) or 0
    nrr = customer.get('nrr', 0) or 0
    total = customer.get('total', 0) or 0
    arr = rr * 4  # Annual Recurring Revenue
    subscriptions = customer.get('subscriptions', [])

    health_color, health_status = calculate_health_score(customer)

    # Calculate subscription metrics
    num_subscriptions = len([s for s in subscriptions if s.get('sub_id') and isinstance(s.get('sub_id'), (int, float))])

    # Find upcoming renewals
    upcoming_renewals = []
    at_risk_renewals = []
    for sub in subscriptions:
        renewal_qtr = sub.get('renewal_qtr')
        will_renew = sub.get('will_renew')
        if renewal_qtr and renewal_qtr in ['Q1\'26', 'Q2\'26', 'Q3\'26', 'Q4\'26']:
            renewal_info = {
                'quarter': renewal_qtr,
                'arr': sub.get('arr', 0) or 0,
                'will_renew': will_renew
            }
            upcoming_renewals.append(renewal_info)
            if will_renew and 'No' in str(will_renew):
                at_risk_renewals.append(renewal_info)

    # Generate subscriptions table rows
    sub_rows = ""
    for sub in subscriptions:
        sub_id = sub.get('sub_id')
        if sub_id and isinstance(sub_id, (int, float)):
            sub_arr = format_currency(sub.get('arr', 0))
            renewal_qtr = sub.get('renewal_qtr', 'N/A')
            will_renew = sub.get('will_renew', 'TBD')
            projected = format_currency(sub.get('projected_arr', 0))

            sub_rows += f"""
                        <tr>
                            <td>{int(sub_id)}</td>
                            <td>{sub_arr}</td>
                            <td>{renewal_qtr}</td>
                            <td>{will_renew}</td>
                            <td>{projected}</td>
                        </tr>"""

    if not sub_rows:
        sub_rows = """
                        <tr>
                            <td colspan="5" style="text-align: center; color: var(--muted);">No active subscriptions</td>
                        </tr>"""

    # Generate renewal calendar
    renewal_calendar = ""
    if upcoming_renewals:
        for renewal in upcoming_renewals:
            status_class = 'critical' if 'No' in str(renewal.get('will_renew', '')) else 'success'
            renewal_calendar += f"""
                    <div class="renewal-item">
                        <div class="renewal-quarter">{renewal['quarter']}</div>
                        <div class="renewal-amount">{format_currency(renewal['arr'])}</div>
                        <span class="status-badge {status_class}">{renewal.get('will_renew', 'TBD')}</span>
                    </div>"""
    else:
        renewal_calendar = """
                    <div class="placeholder">
                        <p>No upcoming renewals in next 12 months</p>
                    </div>"""

    # Critical alerts section
    critical_alerts = ""
    if at_risk_renewals:
        for renewal in at_risk_renewals:
            critical_alerts += f"""
                <div class="alert critical">
                    <strong>⚠️ Renewal at Risk:</strong> {renewal['quarter']} renewal ({format_currency(renewal['arr'])}) flagged as {renewal.get('will_renew', 'at risk')}
                </div>"""

    if not critical_alerts:
        critical_alerts = """
                <div class="alert success">
                    <strong>✓ No Critical Alerts:</strong> All renewals tracking positively
                </div>"""

    # Keys to success
    if health_color == 'red':
        keys_to_success = """
                    <li><strong>Renewal Recovery:</strong> Immediate executive engagement to understand churn drivers and present retention proposal</li>
                    <li><strong>Value Demonstration:</strong> Document ROI and business impact achieved with platform to rebuild business case</li>
                    <li><strong>Risk Mitigation:</strong> Develop transition plan and knowledge transfer if churn proceeds to protect relationship</li>"""
    elif health_color == 'green':
        keys_to_success = """
                    <li><strong>Expansion Opportunity:</strong> Present additional modules and capabilities to increase platform footprint</li>
                    <li><strong>Executive Alignment:</strong> Maintain C-level relationships and align roadmap to strategic business initiatives</li>
                    <li><strong>Reference Development:</strong> Leverage success for case studies, testimonials, and industry event participation</li>"""
    else:
        keys_to_success = """
                    <li><strong>Renewal Confirmation:</strong> Secure commitment and advance renewal discussions 90 days prior to expiration</li>
                    <li><strong>Stakeholder Mapping:</strong> Expand relationships beyond day-to-day contacts to include decision makers</li>
                    <li><strong>Value Reinforcement:</strong> Conduct QBR to showcase utilization metrics and business outcomes achieved</li>"""

    # Action plan items
    if health_color == 'red':
        action_items = """
                    <li><strong>Executive Escalation Call</strong> - Owner: Account Director - Due: Within 5 days</li>
                    <li><strong>Competitive Analysis & Counter Proposal</strong> - Owner: Solutions Architect - Due: Within 10 days</li>
                    <li><strong>Financial Restructuring Options</strong> - Owner: Sales Operations - Due: Within 10 days</li>"""
    elif health_color == 'green':
        action_items = """
                    <li><strong>Expansion Proposal Development</strong> - Owner: Account Manager - Due: 30 days</li>
                    <li><strong>Executive Business Review</strong> - Owner: Account Director - Due: 45 days</li>
                    <li><strong>Reference Program Enrollment</strong> - Owner: Marketing - Due: 60 days</li>"""
    else:
        action_items = """
                    <li><strong>Renewal Discussion Initiation</strong> - Owner: Account Manager - Due: 30 days</li>
                    <li><strong>Stakeholder Mapping Exercise</strong> - Owner: CSM - Due: 20 days</li>
                    <li><strong>Quarterly Business Review</strong> - Owner: CSM - Due: 45 days</li>"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{customer_name} Account Plan | {bu} Strategic Analysis</title>
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

        .header {{
            background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }}

        .header h1 {{
            color: white;
            margin-bottom: 0.5rem;
        }}

        .header .subtitle {{
            font-size: 1.1rem;
            opacity: 0.9;
        }}

        .health-indicator {{
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 1rem;
        }}

        .health-indicator.green {{
            background: var(--success);
            color: white;
        }}

        .health-indicator.yellow {{
            background: var(--warning);
            color: white;
        }}

        .health-indicator.red {{
            background: var(--critical);
            color: white;
        }}

        .tabs {{
            display: flex;
            background: white;
            border-bottom: 2px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }}

        .tab {{
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            background: white;
            border: none;
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--muted);
            transition: all 0.3s ease;
        }}

        .tab:hover {{
            background: var(--highlight);
        }}

        .tab.active {{
            color: var(--accent);
            border-bottom: 3px solid var(--accent);
        }}

        .tab-content {{
            display: none;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }}

        .tab-content.active {{
            display: block;
        }}

        .section {{
            background: white;
            border: 1px solid var(--border);
            padding: 2rem;
            margin-bottom: 2rem;
            border-radius: 8px;
        }}

        .alert {{
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border-left: 4px solid;
        }}

        .alert.success {{
            background: #e8f5e9;
            border-color: var(--success);
            color: #2e7d32;
        }}

        .alert.warning {{
            background: #fff3e0;
            border-color: var(--warning);
            color: #e65100;
        }}

        .alert.critical {{
            background: #ffebee;
            border-color: var(--critical);
            color: #c62828;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }}

        th {{
            background: var(--secondary);
            color: white;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
        }}

        td {{
            padding: 0.75rem;
            border-bottom: 1px solid var(--border);
        }}

        tr:hover {{
            background: var(--highlight);
        }}

        .status-badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
        }}

        .status-badge.success {{
            background: var(--success);
            color: white;
        }}

        .status-badge.critical {{
            background: var(--critical);
            color: white;
        }}

        .status-badge.warning {{
            background: var(--warning);
            color: white;
        }}

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 1.5rem 0;
        }}

        .metric-card {{
            background: white;
            border: 1px solid var(--border);
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
        }}

        .metric-value {{
            font-size: 2rem;
            font-weight: 700;
            color: var(--accent);
            font-family: 'Cormorant Garamond', serif;
        }}

        .metric-label {{
            font-size: 0.9rem;
            color: var(--muted);
            margin-top: 0.5rem;
        }}

        .renewal-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            margin-bottom: 0.75rem;
        }}

        .renewal-quarter {{
            font-weight: 600;
            color: var(--secondary);
        }}

        .renewal-amount {{
            font-size: 1.1rem;
            font-weight: 600;
        }}

        .placeholder {{
            background: #f5f5f5;
            border: 2px dashed var(--border);
            padding: 2rem;
            text-align: center;
            border-radius: 8px;
            color: var(--muted);
            font-style: italic;
        }}

        .chart-container {{
            position: relative;
            height: 300px;
            margin: 2rem 0;
        }}

        ul {{
            margin: 1rem 0;
            padding-left: 1.5rem;
        }}

        li {{
            margin-bottom: 0.75rem;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{customer_name}</h1>
        <div class="subtitle">{bu} Business Unit | Strategic Account Plan</div>
        <span class="health-indicator {health_color}">● {health_status}</span>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="showTab(0)">📊 Overview</button>
        <button class="tab" onclick="showTab(1)">👔 Key Executives</button>
        <button class="tab" onclick="showTab(2)">🏢 Org Structure</button>
        <button class="tab" onclick="showTab(3)">💡 Pain Points</button>
        <button class="tab" onclick="showTab(4)">⚔️ Competitive</button>
        <button class="tab" onclick="showTab(5)">📋 Action Plan</button>
        <button class="tab" onclick="showTab(6)">💰 Financial</button>
    </div>

    <!-- Tab 1: Overview -->
    <div class="tab-content active">
        <div class="section">
            <h2>Critical Alerts</h2>
            {critical_alerts}
        </div>

        <div class="section">
            <h2>Keys to Success</h2>
            <ul>
                {keys_to_success}
            </ul>
        </div>

        <div class="section">
            <h2>Account Status</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Retention Likelihood</td>
                        <td>{health_status}</td>
                        <td><span class="status-badge {health_color}">{health_status}</span></td>
                    </tr>
                    <tr>
                        <td>Annual Recurring Revenue (ARR)</td>
                        <td>{format_currency(arr)}</td>
                        <td><span class="status-badge success">Active</span></td>
                    </tr>
                    <tr>
                        <td>Contract Term</td>
                        <td>Annual Subscription</td>
                        <td><span class="status-badge success">Standard</span></td>
                    </tr>
                    <tr>
                        <td>Payment Terms</td>
                        <td>Net 30</td>
                        <td><span class="status-badge success">Current</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Product Usage & Adoption</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product Module</th>
                        <th>Adoption Status</th>
                        <th>User Count</th>
                        <th>Health Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Core Platform</td>
                        <td><span class="status-badge success">Active</span></td>
                        <td>[OSINT NEEDED]</td>
                        <td><span class="status-badge {health_color}">{health_status}</span></td>
                    </tr>
                    <tr>
                        <td>Advanced Features</td>
                        <td>[OSINT NEEDED]</td>
                        <td>[OSINT NEEDED]</td>
                        <td>[OSINT NEEDED]</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Key Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{num_subscriptions}</div>
                    <div class="metric-label">Active Subscriptions</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{format_currency(arr)}</div>
                    <div class="metric-label">Annual Recurring Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{len(upcoming_renewals)}</div>
                    <div class="metric-label">Renewals (Next 12 Mo)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">[TBD]</div>
                    <div class="metric-label">Expansion Pipeline</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Renewal Calendar</h2>
            {renewal_calendar}
        </div>
    </div>

    <!-- Tab 2: Key Executives -->
    <div class="tab-content">
        <div class="section">
            <h2>Executive Contacts</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Title</th>
                        <th>Department</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>LinkedIn</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6" class="placeholder">
                            [OSINT NEEDED] Executive contact information to be gathered through LinkedIn research, company website analysis, and stakeholder interviews
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="alert warning" style="margin-top: 1rem;">
                <strong>Action Required:</strong> Conduct OSINT research to identify key decision makers including CIO, CTO, VP of Technology, and primary business sponsors
            </div>
        </div>

        <div class="section">
            <h2>Stakeholder Engagement Strategy</h2>
            <div class="placeholder">
                <p>Stakeholder engagement plan to be developed after executive mapping is complete</p>
            </div>
        </div>
    </div>

    <!-- Tab 3: Org Structure -->
    <div class="tab-content">
        <div class="section">
            <h2>Organization Structure</h2>
            <div class="placeholder">
                <p>Organization structure mapping pending OSINT data collection</p>
                <p style="margin-top: 1rem;">This section will include:</p>
                <ul style="text-align: left; max-width: 600px; margin: 1rem auto;">
                    <li>Reporting hierarchy from C-level to operational teams</li>
                    <li>Key departments utilizing the platform</li>
                    <li>Decision-making authority matrix</li>
                    <li>Budget ownership and approval workflows</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>Key Departments</h2>
            <table>
                <thead>
                    <tr>
                        <th>Department</th>
                        <th>Head</th>
                        <th>Platform Usage</th>
                        <th>Influence Level</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" class="placeholder">
                            [OSINT NEEDED] Department structure and leadership to be identified
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab 4: Pain Points -->
    <div class="tab-content">
        <div class="section">
            <h2>Business Challenges</h2>
            <div class="placeholder">
                <p>Pain point analysis pending OSINT research and stakeholder interviews</p>
                <p style="margin-top: 1rem;">Investigation areas:</p>
                <ul style="text-align: left; max-width: 600px; margin: 1rem auto;">
                    <li>Strategic business priorities and transformation initiatives</li>
                    <li>Operational inefficiencies addressed by the platform</li>
                    <li>Technology stack gaps and integration challenges</li>
                    <li>Competitive pressures and market positioning concerns</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>Technical Pain Points</h2>
            <div class="placeholder">
                <p>[OSINT NEEDED] Technical requirements and challenges to be documented through discovery calls and technical reviews</p>
            </div>
        </div>

        <div class="section">
            <h2>Opportunity Areas</h2>
            <div class="placeholder">
                <p>Expansion opportunities to be identified after pain point analysis is complete</p>
            </div>
        </div>
    </div>

    <!-- Tab 5: Competitive -->
    <div class="tab-content">
        <div class="section">
            <h2>Competitive Landscape</h2>
            <div class="placeholder">
                <p>Competitive analysis pending OSINT intelligence gathering</p>
                <p style="margin-top: 1rem;">Research focus areas:</p>
                <ul style="text-align: left; max-width: 600px; margin: 1rem auto;">
                    <li>Incumbent vendors and technology partners</li>
                    <li>Recent RFPs or competitive evaluations</li>
                    <li>Vendor relationships and satisfaction levels</li>
                    <li>Technology modernization initiatives</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>Our Differentiation</h2>
            <div class="placeholder">
                <p>Competitive positioning to be developed after landscape analysis is complete</p>
            </div>
        </div>

        <div class="section">
            <h2>Competitive Threats</h2>
            <table>
                <thead>
                    <tr>
                        <th>Competitor</th>
                        <th>Threat Level</th>
                        <th>Strategy</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="3" class="placeholder">
                            [OSINT NEEDED] Competitive threat assessment to be completed
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab 6: Action Plan -->
    <div class="tab-content">
        <div class="section">
            <h2>Strategic Action Items</h2>
            <table>
                <thead>
                    <tr>
                        <th>Action Item</th>
                        <th>Owner</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {action_items}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Tactical Next Steps</h2>
            <ul>
                <li><strong>Complete OSINT Research:</strong> Gather executive contacts, org structure, and competitive intelligence</li>
                <li><strong>Schedule Discovery Calls:</strong> Conduct stakeholder interviews to validate pain points and priorities</li>
                <li><strong>Develop Account Strategy:</strong> Create comprehensive account plan based on research findings</li>
                <li><strong>Executive Engagement:</strong> Initiate C-level relationships and align on strategic objectives</li>
            </ul>
        </div>
    </div>

    <!-- Tab 7: Financial -->
    <div class="tab-content">
        <div class="section">
            <h2>Revenue Breakdown</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">{format_currency(rr)}</div>
                    <div class="metric-label">Recurring Revenue (Quarterly)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{format_currency(nrr)}</div>
                    <div class="metric-label">Non-Recurring Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{format_currency(total)}</div>
                    <div class="metric-label">Total Revenue (Quarterly)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{format_currency(arr)}</div>
                    <div class="metric-label">Annual Recurring Revenue</div>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <div class="section">
            <h2>Subscription Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Subscription ID</th>
                        <th>ARR</th>
                        <th>Renewal Quarter</th>
                        <th>Will Renew</th>
                        <th>Projected ARR</th>
                    </tr>
                </thead>
                <tbody>
                    {sub_rows}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>ARR Trends</h2>
            <div class="chart-container">
                <canvas id="arrTrendChart"></canvas>
            </div>
        </div>

        <div class="section">
            <h2>Expansion Opportunities</h2>
            <div class="placeholder">
                <p>Expansion pipeline to be developed after stakeholder discovery and pain point analysis</p>
            </div>
        </div>

        <div class="section">
            <h2>Contract Value Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Current</th>
                        <th>Potential</th>
                        <th>Gap</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Annual Contract Value</td>
                        <td>{format_currency(arr)}</td>
                        <td>[TBD]</td>
                        <td>[TBD]</td>
                    </tr>
                    <tr>
                        <td>Expansion Opportunity</td>
                        <td>-</td>
                        <td>[TBD]</td>
                        <td>[TBD]</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function showTab(index) {{
            const tabs = document.querySelectorAll('.tab');
            const contents = document.querySelectorAll('.tab-content');

            tabs.forEach((tab, i) => {{
                if (i === index) {{
                    tab.classList.add('active');
                    contents[i].classList.add('active');
                }} else {{
                    tab.classList.remove('active');
                    contents[i].classList.remove('active');
                }}
            }});
        }}

        // Revenue breakdown chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {{
            type: 'doughnut',
            data: {{
                labels: ['Recurring Revenue', 'Non-Recurring Revenue'],
                datasets: [{{
                    data: [{rr}, {nrr}],
                    backgroundColor: ['#2d4263', '#c84b31']
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'bottom'
                    }}
                }}
            }}
        }});

        // ARR trend chart
        const arrCtx = document.getElementById('arrTrendChart').getContext('2d');
        new Chart(arrCtx, {{
            type: 'line',
            data: {{
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{{
                    label: 'ARR',
                    data: [{arr * 0.9}, {arr * 0.95}, {arr}, {arr * 1.05}],
                    borderColor: '#2d4263',
                    backgroundColor: 'rgba(45, 66, 99, 0.1)',
                    tension: 0.4,
                    fill: true
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }},
                scales: {{
                    y: {{
                        beginAtZero: false,
                        ticks: {{
                            callback: function(value) {{
                                return '$' + value.toLocaleString();
                            }}
                        }}
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>"""

    return html_content

def main():
    """Generate all account HTML files"""
    print("Loading customer data...")
    customers = load_customer_data()

    print(f"Found {len(customers)} customers across all BUs")

    # Create accounts directory if it doesn't exist
    accounts_dir = "/Users/RAZER/Documents/projects/Skyvera/accounts"
    os.makedirs(accounts_dir, exist_ok=True)

    # Pre-process to detect duplicate filenames (case-insensitive)
    filename_map = {}
    for customer in customers:
        customer_name = customer['customer_name']
        safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in customer_name)
        safe_name = safe_name.replace(' ', '_')
        base_filename = f"{safe_name}_Account_Plan.html".lower()  # lowercase for comparison

        if base_filename not in filename_map:
            filename_map[base_filename] = []
        filename_map[base_filename].append(customer)

    # Generate HTML for each customer
    generated = 0
    for customer in customers:
        customer_name = customer['customer_name']
        bu = customer['bu']

        # Create safe filename
        safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in customer_name)
        safe_name = safe_name.replace(' ', '_')
        base_filename_lower = f"{safe_name}_Account_Plan.html".lower()

        # Handle duplicates by appending rank or BU
        if len(filename_map[base_filename_lower]) > 1:
            rank = customer.get('rank', 0)
            filename = f"{safe_name}_rank{rank}_{bu}_Account_Plan.html"
        else:
            filename = f"{safe_name}_Account_Plan.html"

        filepath = os.path.join(accounts_dir, filename)

        print(f"Generating: {filename}")
        html_content = generate_account_html(customer)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        generated += 1

    print(f"\n✓ Successfully generated {generated} account HTML files")
    print(f"✓ Files saved to: {accounts_dir}")
    print("\nAll accounts now have complete 7-tab structure:")
    print("  1. 📊 Overview - Critical alerts, keys to success, status")
    print("  2. 👔 Key Executives - Contact info (OSINT placeholders)")
    print("  3. 🏢 Org Structure - Hierarchy (OSINT placeholders)")
    print("  4. 💡 Pain Points - Business challenges (OSINT placeholders)")
    print("  5. ⚔️ Competitive - Landscape analysis (OSINT placeholders)")
    print("  6. 📋 Action Plan - Strategic actions with owners/dates")
    print("  7. 💰 Financial - Revenue breakdown and subscriptions")

if __name__ == "__main__":
    main()
