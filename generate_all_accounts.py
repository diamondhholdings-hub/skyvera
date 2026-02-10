#!/usr/bin/env python3
"""
Generate standalone HTML files for all customer accounts
"""

import json
import os
import urllib.parse
from pathlib import Path


def format_currency(value):
    """Format value as currency"""
    if value == 0:
        return "$0"
    return f"${value:,.0f}"


def calculate_health_score(customer, bu_name):
    """Calculate customer health score based on various factors"""
    score = 100

    # Check if customer has revenue
    if customer['total'] == 0:
        return 0

    # Check renewal risk
    for sub in customer['subscriptions']:
        will_renew = sub.get('will_renew', 'Yes')
        if will_renew == 'No' or will_renew == 'No (SF)':
            score -= 30
        elif will_renew == 'BU decision required':
            score -= 20

    # Check RR vs NRR ratio (prefer recurring)
    if customer['total'] > 0:
        rr_ratio = customer['rr'] / customer['total']
        if rr_ratio < 0.3:
            score -= 15
        elif rr_ratio < 0.5:
            score -= 10

    # Check if customer has subscriptions
    if len(customer['subscriptions']) == 0 and customer['nrr'] == 0:
        score -= 25

    return max(0, min(100, score))


def get_health_badge(score):
    """Return badge class and text for health score"""
    if score >= 80:
        return 'badge-success', 'Healthy'
    elif score >= 60:
        return 'badge-medium', 'At Risk'
    elif score >= 40:
        return 'badge-high', 'Critical'
    else:
        return 'badge-critical', 'Churned'


def url_encode_name(name):
    """URL encode customer name for file path"""
    # Replace slashes and other problematic characters
    clean_name = name.replace('/', '-').replace('\\', '-').replace(':', '-')
    # URL encode
    return urllib.parse.quote(clean_name, safe='')


def generate_account_html(customer, bu_name):
    """Generate HTML content for a single account"""

    customer_name = customer['customer_name']
    rr = customer['rr']
    nrr = customer['nrr']
    total = customer['total']
    subscriptions = customer['subscriptions']

    health_score = calculate_health_score(customer, bu_name)
    badge_class, badge_text = get_health_badge(health_score)

    # Build subscriptions table
    sub_rows = ""
    if subscriptions:
        for sub in subscriptions:
            sub_id = sub.get('sub_id', 'N/A')
            arr = sub.get('arr', 0)
            renewal_qtr = sub.get('renewal_qtr', 'N/A')
            will_renew = sub.get('will_renew', 'N/A')
            projected_arr = sub.get('projected_arr', 0)

            # Skip invalid subscriptions
            if isinstance(sub_id, str) and not sub_id.replace('.', '').isdigit():
                continue

            # Renewal badge
            if will_renew == 'Yes':
                renewal_badge = '<span class="badge badge-success">Will Renew</span>'
            elif will_renew == 'No' or will_renew == 'No (SF)':
                renewal_badge = '<span class="badge badge-critical">At Risk</span>'
            elif will_renew == 'BU decision required':
                renewal_badge = '<span class="badge badge-high">Decision Required</span>'
            else:
                renewal_badge = '<span class="badge badge-neutral">Unknown</span>'

            arr_display = format_currency(arr) if arr else 'N/A'
            projected_display = format_currency(projected_arr) if projected_arr else 'N/A'

            sub_rows += f"""
                <tr>
                    <td>{sub_id}</td>
                    <td>{arr_display}</td>
                    <td>{renewal_qtr}</td>
                    <td>{renewal_badge}</td>
                    <td>{projected_display}</td>
                </tr>
            """
    else:
        sub_rows = '<tr><td colspan="5" style="text-align: center; color: var(--muted);">No active subscriptions (NRR only)</td></tr>'

    # Calculate RR percentage
    rr_pct = (rr / total * 100) if total > 0 else 0
    nrr_pct = (nrr / total * 100) if total > 0 else 0

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{customer_name} | {bu_name} Account Plan</title>
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

        .breadcrumb {{
            font-size: 0.9rem;
            opacity: 0.7;
            margin-bottom: 1rem;
        }}

        .breadcrumb a {{
            color: var(--paper);
            text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }}

        .breadcrumb a:hover {{
            opacity: 0.8;
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

        /* Container */
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }}

        /* Cards */
        .card {{
            background: white;
            border: 1px solid var(--border);
            padding: 2rem;
            margin-bottom: 2rem;
            position: relative;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .data-table td {{
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }}

        .data-table tbody tr:hover {{
            background: var(--highlight);
        }}

        /* Badges */
        .badge {{
            display: inline-block;
            padding: 0.35rem 0.8rem;
            border-radius: 2px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .badge-critical {{ background: var(--critical); color: white; }}
        .badge-high {{ background: var(--warning); color: white; }}
        .badge-medium {{ background: #ffc107; color: var(--ink); }}
        .badge-success {{ background: var(--success); color: white; }}
        .badge-neutral {{ background: var(--muted); color: white; }}

        /* Footer */
        .footer {{
            text-align: center;
            padding: 3rem 2rem;
            color: var(--muted);
            border-top: 1px solid var(--border);
            margin-top: 4rem;
        }}

        .footer a {{
            color: var(--accent);
            text-decoration: none;
            border-bottom: 1px solid var(--accent);
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="breadcrumb">
                <a href="../index.html">Dashboard</a> / <a href="index.html">All Accounts</a> / {customer_name}
            </div>
            <h1>{customer_name}</h1>
            <div class="subtitle">Account Plan - {bu_name} Business Unit</div>

            <div class="header-stats">
                <div class="stat-card">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">{format_currency(total)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Recurring Revenue</div>
                    <div class="stat-value">{format_currency(rr)}</div>
                    <div class="stat-change">{rr_pct:.1f}% of total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Non-Recurring Revenue</div>
                    <div class="stat-value">{format_currency(nrr)}</div>
                    <div class="stat-change">{nrr_pct:.1f}% of total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Health Score</div>
                    <div class="stat-value">{health_score}</div>
                    <div class="stat-change"><span class="badge {badge_class}">{badge_text}</span></div>
                </div>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="card">
            <h2>Active Subscriptions</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Subscription ID</th>
                        <th>ARR</th>
                        <th>Renewal Quarter</th>
                        <th>Status</th>
                        <th>Projected ARR</th>
                    </tr>
                </thead>
                <tbody>
                    {sub_rows}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Account Overview</h2>
            <table class="data-table">
                <tbody>
                    <tr>
                        <td><strong>Business Unit</strong></td>
                        <td>{bu_name}</td>
                    </tr>
                    <tr>
                        <td><strong>Account Rank</strong></td>
                        <td>#{customer['rank']} in {bu_name}</td>
                    </tr>
                    <tr>
                        <td><strong>Percentage of BU Revenue</strong></td>
                        <td>{customer['pct_of_total']:.2f}%</td>
                    </tr>
                    <tr>
                        <td><strong>Number of Subscriptions</strong></td>
                        <td>{len([s for s in subscriptions if isinstance(s.get('sub_id'), (int, float))])}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="footer">
        <p>Skyvera Account Intelligence | Generated {bu_name} Account Plan</p>
        <p><a href="index.html">View All Accounts</a> | <a href="../index.html">Back to Dashboard</a></p>
    </div>
</body>
</html>
"""
    return html


def generate_index_html(all_customers):
    """Generate index page listing all accounts"""

    # Sort all customers by total revenue
    sorted_customers = sorted(all_customers, key=lambda x: x['total'], reverse=True)

    # Generate table rows
    rows = ""
    for i, cust in enumerate(sorted_customers, 1):
        filename = url_encode_name(cust['customer_name']) + '.html'
        health_score = calculate_health_score(cust, cust['bu_name'])
        badge_class, badge_text = get_health_badge(health_score)

        rows += f"""
            <tr>
                <td>{i}</td>
                <td><a href="{filename}" style="color: var(--accent); text-decoration: none; font-weight: 600;">{cust['customer_name']}</a></td>
                <td><span class="badge badge-neutral">{cust['bu_name']}</span></td>
                <td>{format_currency(cust['total'])}</td>
                <td>{format_currency(cust['rr'])}</td>
                <td>{format_currency(cust['nrr'])}</td>
                <td><span class="badge {badge_class}">{badge_text}</span></td>
            </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Customer Accounts | Skyvera</title>
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

        h1, h2 {{
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            line-height: 1.2;
        }}

        h1 {{ font-size: 3.5rem; font-weight: 300; letter-spacing: -0.02em; }}
        h2 {{ font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--secondary); }}

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

        .breadcrumb {{
            font-size: 0.9rem;
            opacity: 0.7;
            margin-bottom: 1rem;
        }}

        .breadcrumb a {{
            color: var(--paper);
            text-decoration: none;
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }}

        .breadcrumb a:hover {{
            opacity: 0.8;
        }}

        .subtitle {{
            font-size: 1.1rem;
            opacity: 0.85;
            margin-bottom: 1rem;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }}

        .card {{
            background: white;
            border: 1px solid var(--border);
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }}

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
            position: sticky;
            top: 0;
            z-index: 10;
        }}

        .data-table th {{
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .data-table td {{
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }}

        .data-table tbody tr:hover {{
            background: var(--highlight);
        }}

        .badge {{
            display: inline-block;
            padding: 0.35rem 0.8rem;
            border-radius: 2px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}

        .badge-critical {{ background: var(--critical); color: white; }}
        .badge-high {{ background: var(--warning); color: white; }}
        .badge-medium {{ background: #ffc107; color: var(--ink); }}
        .badge-success {{ background: var(--success); color: white; }}
        .badge-neutral {{ background: var(--muted); color: white; }}

        .footer {{
            text-align: center;
            padding: 3rem 2rem;
            color: var(--muted);
            border-top: 1px solid var(--border);
            margin-top: 4rem;
        }}

        .footer a {{
            color: var(--accent);
            text-decoration: none;
            border-bottom: 1px solid var(--accent);
        }}
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="breadcrumb">
                <a href="../index.html">Dashboard</a> / All Accounts
            </div>
            <h1>Customer Accounts</h1>
            <div class="subtitle">Complete directory of all {len(sorted_customers)} customer accounts across all business units</div>
        </div>
    </div>

    <div class="container">
        <div class="card">
            <h2>All Accounts</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Customer Name</th>
                        <th>Business Unit</th>
                        <th>Total Revenue</th>
                        <th>RR</th>
                        <th>NRR</th>
                        <th>Health</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
    </div>

    <div class="footer">
        <p>Skyvera Account Intelligence | All Customer Accounts</p>
        <p><a href="../index.html">Back to Dashboard</a></p>
    </div>
</body>
</html>
"""
    return html


def main():
    """Main function to generate all account pages"""

    # Define data files
    data_files = {
        'CloudSense': '/Users/RAZER/Documents/projects/Skyvera/data/customers_cloudsense_all.json',
        'Kandy': '/Users/RAZER/Documents/projects/Skyvera/data/customers_kandy_all.json',
        'STL': '/Users/RAZER/Documents/projects/Skyvera/data/customers_stl_all.json',
        'NewNet': '/Users/RAZER/Documents/projects/Skyvera/data/customers_newnet_all.json'
    }

    # Create accounts directory
    accounts_dir = Path('/Users/RAZER/Documents/projects/Skyvera/accounts')
    accounts_dir.mkdir(exist_ok=True)

    print(f"Creating accounts directory: {accounts_dir}")

    all_customers = []
    total_count = 0

    # Process each BU
    for bu_name, file_path in data_files.items():
        print(f"\nProcessing {bu_name}...")

        with open(file_path, 'r') as f:
            data = json.load(f)

        customers = data['customers']

        # Generate HTML for each customer
        for customer in customers:
            # Skip customers with zero revenue
            if customer['total'] == 0:
                continue

            # Add BU name to customer data
            customer['bu_name'] = bu_name
            all_customers.append(customer)

            # Generate filename
            filename = url_encode_name(customer['customer_name']) + '.html'
            file_path = accounts_dir / filename

            # Generate and write HTML
            html_content = generate_account_html(customer, bu_name)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

            total_count += 1
            print(f"  ✓ {customer['customer_name']} -> {filename}")

    # Generate index page
    print("\nGenerating index page...")
    index_html = generate_index_html(all_customers)
    index_path = accounts_dir / 'index.html'
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_html)
    print(f"  ✓ index.html created")

    print(f"\n{'='*60}")
    print(f"COMPLETE: Generated {total_count} account pages")
    print(f"Output directory: {accounts_dir}")
    print(f"Index page: {index_path}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
