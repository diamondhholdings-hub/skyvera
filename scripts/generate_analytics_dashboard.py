#!/usr/bin/env python3
"""Generate master analytics dashboard with embedded customer data."""

import json
from pathlib import Path

def load_all_customers():
    """Load and aggregate customer data from all BUs (100% of customers)."""
    data_dir = Path(__file__).parent.parent / 'data'
    output_dir = Path(__file__).parent.parent / 'output'

    all_customers = []
    bu_data = {}

    bu_files = {
        'CloudSense': 'customers_cloudsense_all.json',
        'Kandy': 'customers_kandy_all.json',
        'STL': 'customers_stl_all.json',
        'NewNet': 'customers_newnet_all.json'
    }

    # Map of BU to output directory for dashboard links
    bu_paths = {
        'CloudSense': '',
        'Kandy': 'kandy/',
        'STL': 'stl/',
        'NewNet': 'newnet/'
    }

    for bu_name, filename in bu_files.items():
        filepath = data_dir / filename
        with open(filepath, 'r') as f:
            data = json.load(f)
            bu_data[bu_name] = data

            # Add BU name and dashboard info to each customer
            for customer in data['customers']:
                customer_with_bu = customer.copy()
                customer_with_bu['bu'] = bu_name

                # Check if dashboard exists for this customer
                dashboard_filename = customer['customer_name'].replace('/', '-').replace(' ', '_') + '.html'
                dashboard_path = output_dir / bu_paths[bu_name] / dashboard_filename
                customer_with_bu['has_dashboard'] = dashboard_path.exists()
                customer_with_bu['dashboard_url'] = bu_paths[bu_name] + dashboard_filename if customer_with_bu['has_dashboard'] else None

                all_customers.append(customer_with_bu)

    return all_customers, bu_data

def generate_html(customers_data):
    """Generate analytics dashboard HTML."""

    # Convert to JSON string for embedding
    customers_json = json.dumps(customers_data, indent=2)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skyvera Master Analytics | Multi-BU Account Intelligence</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
            --cloudsense: #2d4263;
            --kandy: #e65100;
            --stl: #1976d2;
            --newnet: #388e3c;
        }}

        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'DM Sans', sans-serif;
            background: var(--paper);
            color: var(--ink);
            line-height: 1.6;
        }}
        h1, h2 {{ font-family: 'Cormorant Garamond', serif; }}

        .header {{
            background: linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%);
            color: var(--paper);
            padding: 3rem 2rem;
            text-align: center;
        }}

        .header h1 {{
            font-size: 3rem;
            font-weight: 300;
            margin-bottom: 1rem;
        }}

        .controls {{
            background: white;
            padding: 2rem;
            margin: 2rem auto;
            max-width: 1400px;
            border: 1px solid var(--border);
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
        }}

        .filter-group {{
            flex: 1;
            min-width: 200px;
        }}

        .filter-group label {{
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            font-size: 0.85rem;
            color: var(--muted);
        }}

        .filter-group select {{
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 1rem;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }}

        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}

        .stat-card {{
            background: white;
            padding: 1.5rem;
            border: 1px solid var(--border);
            border-left: 4px solid var(--accent);
        }}

        .stat-label {{
            font-size: 0.85rem;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 0.5rem;
        }}

        .stat-value {{
            font-size: 2rem;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            color: var(--secondary);
        }}

        .stat-subtitle {{
            font-size: 0.85rem;
            color: var(--muted);
            margin-top: 0.25rem;
        }}

        .charts-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }}

        .chart-card {{
            background: white;
            padding: 2rem;
            border: 1px solid var(--border);
        }}

        .chart-card h2 {{
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: var(--secondary);
        }}

        .table-card {{
            background: white;
            padding: 2rem;
            border: 1px solid var(--border);
            margin-bottom: 2rem;
            overflow-x: auto;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }}

        th, td {{
            text-align: left;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }}

        th {{
            background: var(--highlight);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            position: sticky;
            top: 0;
        }}

        tr:hover {{
            background: var(--paper);
        }}

        .bu-badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 3px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
        }}

        .bu-cloudsense {{ background: var(--cloudsense); }}
        .bu-kandy {{ background: var(--kandy); }}
        .bu-stl {{ background: var(--stl); }}
        .bu-newnet {{ background: var(--newnet); }}

        .region-badge {{
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.75rem;
            font-weight: 600;
            background: #f5f5f5;
            color: var(--ink);
        }}
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
                <option value="CloudSense">CloudSense</option>
                <option value="Kandy">Kandy</option>
                <option value="STL">STL</option>
                <option value="NewNet">NewNet</option>
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
                <h2>RR vs NRR Mix by BU</h2>
                <canvas id="rrNrrChart"></canvas>
            </div>

            <div class="chart-card">
                <h2>Top 10 Customers (All BUs)</h2>
                <canvas id="topCustomersChart"></canvas>
            </div>
        </div>

        <div class="table-card">
            <h2>Customer Drill-Down</h2>
            <table id="customerTable">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Customer Name</th>
                        <th>BU</th>
                        <th>Region</th>
                        <th>RR</th>
                        <th>NRR</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody id="customerTableBody">
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Embedded customer data
        const allCustomers = {customers_json};

        let currentBUFilter = 'all';
        let currentRegionFilter = 'all';
        let charts = {{}};

        function filterCustomers() {{
            return allCustomers.filter(customer => {{
                const buMatch = currentBUFilter === 'all' || customer.bu === currentBUFilter;
                const regionMatch = currentRegionFilter === 'all' || customer.region === currentRegionFilter;
                return buMatch && regionMatch;
            }});
        }}

        function updateStats() {{
            const filtered = filterCustomers();
            const totalCustomers = filtered.length;
            const totalRevenue = filtered.reduce((sum, c) => sum + c.total, 0);
            const totalRR = filtered.reduce((sum, c) => sum + c.rr, 0);
            const totalNRR = filtered.reduce((sum, c) => sum + c.nrr, 0);

            const rrPct = totalRevenue > 0 ? (totalRR / totalRevenue * 100).toFixed(1) : 0;
            const nrrPct = totalRevenue > 0 ? (totalNRR / totalRevenue * 100).toFixed(1) : 0;

            document.getElementById('statsGrid').innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">Total Customers</div>
                    <div class="stat-value">${{totalCustomers}}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">$$${{(totalRevenue/1000000).toFixed(1)}}M</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Recurring Revenue</div>
                    <div class="stat-value">$$${{(totalRR/1000000).toFixed(1)}}M</div>
                    <div class="stat-subtitle">${{rrPct}}% of total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Non-Recurring Revenue</div>
                    <div class="stat-value">$$${{(totalNRR/1000000).toFixed(1)}}M</div>
                    <div class="stat-subtitle">${{nrrPct}}% of total</div>
                </div>
            `;
        }}

        function updateBUChart() {{
            const filtered = filterCustomers();
            const buData = {{}};

            filtered.forEach(customer => {{
                if (!buData[customer.bu]) buData[customer.bu] = 0;
                buData[customer.bu] += customer.total;
            }});

            const ctx = document.getElementById('buRevenueChart');
            if (charts.buRevenue) charts.buRevenue.destroy();

            const colors = {{
                'CloudSense': '#2d4263',
                'Kandy': '#e65100',
                'STL': '#1976d2',
                'NewNet': '#388e3c'
            }};

            charts.buRevenue = new Chart(ctx, {{
                type: 'bar',
                data: {{
                    labels: Object.keys(buData),
                    datasets: [{{
                        label: 'Revenue',
                        data: Object.values(buData).map(v => v / 1000000),
                        backgroundColor: Object.keys(buData).map(bu => colors[bu])
                    }}]
                }},
                options: {{
                    responsive: true,
                    plugins: {{
                        legend: {{ display: false }}
                    }},
                    scales: {{
                        y: {{
                            beginAtZero: true,
                            title: {{ display: true, text: 'Revenue ($M)' }}
                        }}
                    }}
                }}
            }});
        }}

        function updateRegionChart() {{
            const filtered = filterCustomers();
            const regionData = {{}};

            filtered.forEach(customer => {{
                if (!regionData[customer.region]) regionData[customer.region] = 0;
                regionData[customer.region] += customer.total;
            }});

            const ctx = document.getElementById('regionRevenueChart');
            if (charts.regionRevenue) charts.regionRevenue.destroy();

            charts.regionRevenue = new Chart(ctx, {{
                type: 'pie',
                data: {{
                    labels: Object.keys(regionData),
                    datasets: [{{
                        data: Object.values(regionData).map(v => v / 1000000),
                        backgroundColor: ['#e65100', '#2d4263', '#388e3c']
                    }}]
                }},
                options: {{
                    responsive: true,
                    plugins: {{
                        legend: {{ position: 'bottom' }}
                    }}
                }}
            }});
        }}

        function updateRRNRRChart() {{
            const filtered = filterCustomers();
            const buData = {{}};

            filtered.forEach(customer => {{
                if (!buData[customer.bu]) buData[customer.bu] = {{ rr: 0, nrr: 0 }};
                buData[customer.bu].rr += customer.rr;
                buData[customer.bu].nrr += customer.nrr;
            }});

            const ctx = document.getElementById('rrNrrChart');
            if (charts.rrNrr) charts.rrNrr.destroy();

            charts.rrNrr = new Chart(ctx, {{
                type: 'bar',
                data: {{
                    labels: Object.keys(buData),
                    datasets: [
                        {{
                            label: 'RR',
                            data: Object.keys(buData).map(bu => buData[bu].rr / 1000000),
                            backgroundColor: '#2d4263'
                        }},
                        {{
                            label: 'NRR',
                            data: Object.keys(buData).map(bu => buData[bu].nrr / 1000000),
                            backgroundColor: '#c84b31'
                        }}
                    ]
                }},
                options: {{
                    responsive: true,
                    plugins: {{
                        legend: {{ position: 'bottom' }}
                    }},
                    scales: {{
                        x: {{ stacked: true }},
                        y: {{
                            stacked: true,
                            beginAtZero: true,
                            title: {{ display: true, text: 'Revenue ($M)' }}
                        }}
                    }}
                }}
            }});
        }}

        function updateTopCustomersChart() {{
            const filtered = filterCustomers();
            const sorted = [...filtered].sort((a, b) => b.total - a.total).slice(0, 10);

            const ctx = document.getElementById('topCustomersChart');
            if (charts.topCustomers) charts.topCustomers.destroy();

            const colors = {{
                'CloudSense': '#2d4263',
                'Kandy': '#e65100',
                'STL': '#1976d2',
                'NewNet': '#388e3c'
            }};

            charts.topCustomers = new Chart(ctx, {{
                type: 'bar',
                data: {{
                    labels: sorted.map(c => c.customer_name.length > 30 ? c.customer_name.substring(0, 30) + '...' : c.customer_name),
                    datasets: [{{
                        label: 'Revenue',
                        data: sorted.map(c => c.total / 1000000),
                        backgroundColor: sorted.map(c => colors[c.bu])
                    }}]
                }},
                options: {{
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {{
                        legend: {{ display: false }}
                    }},
                    scales: {{
                        x: {{
                            beginAtZero: true,
                            title: {{ display: true, text: 'Revenue ($M)' }}
                        }}
                    }}
                }}
            }});
        }}

        function updateTable() {{
            const filtered = filterCustomers();
            const sorted = [...filtered].sort((a, b) => b.total - a.total);

            const tbody = document.getElementById('customerTableBody');
            tbody.innerHTML = sorted.map((customer, idx) => {{
                const customerNameDisplay = customer.has_dashboard
                    ? `<a href="${{customer.dashboard_url}}" style="color: var(--secondary); text-decoration: none; font-weight: 500;">${{customer.customer_name}}</a>`
                    : customer.customer_name;

                return `
                <tr>
                    <td>${{idx + 1}}</td>
                    <td>${{customerNameDisplay}}</td>
                    <td><span class="bu-badge bu-${{customer.bu.toLowerCase()}}">${{customer.bu}}</span></td>
                    <td><span class="region-badge">${{customer.region}}</span></td>
                    <td>$$${{(customer.rr/1000000).toFixed(2)}}M</td>
                    <td>$$${{(customer.nrr/1000000).toFixed(2)}}M</td>
                    <td><strong>$$${{(customer.total/1000000).toFixed(2)}}M</strong></td>
                </tr>
                `;
            }}).join('');
        }}

        function applyFilters() {{
            currentBUFilter = document.getElementById('buFilter').value;
            currentRegionFilter = document.getElementById('regionFilter').value;

            updateStats();
            updateBUChart();
            updateRegionChart();
            updateRRNRRChart();
            updateTopCustomersChart();
            updateTable();
        }}

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {{
            applyFilters();
        }});
    </script>
</body>
</html>"""

    return html

def main():
    print("Generating master analytics dashboard...")

    customers, bu_data = load_all_customers()

    print(f"Loaded {len(customers)} customers from all BUs")
    print(f"  CloudSense: {len(bu_data['CloudSense']['customers'])} customers")
    print(f"  Kandy: {len(bu_data['Kandy']['customers'])} customers")
    print(f"  STL: {len(bu_data['STL']['customers'])} customers")
    print(f"  NewNet: {len(bu_data['NewNet']['customers'])} customers")

    html = generate_html(customers)

    output_path = Path(__file__).parent.parent / 'output' / 'analytics.html'
    with open(output_path, 'w') as f:
        f.write(html)

    print(f"\n✅ Analytics dashboard generated: {output_path}")
    print(f"   File size: {len(html) / 1024:.1f} KB")

if __name__ == '__main__':
    main()
