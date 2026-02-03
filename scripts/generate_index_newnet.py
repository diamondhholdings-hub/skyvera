"""Generate NewNet BU index page with customer selector."""
import json
from datetime import datetime

def load_customers():
    with open('data/customers_newnet_top80.json', 'r') as f:
        return json.load(f)

def generate_customer_cards(customers):
    """Generate HTML cards for each customer."""
    cards = []
    for customer in customers:
        filename = customer['customer_name'].replace('/', '-').replace(' ', '_') + '.html'

        # Determine tier badge
        if customer['rank'] <= 3:
            badge_class = 'badge-critical'
            badge_text = 'STRATEGIC'
        elif customer['rank'] <= 10:
            badge_class = 'badge-high'
            badge_text = 'HIGH VALUE'
        else:
            badge_class = 'badge-medium'
            badge_text = 'KEY ACCOUNT'

        card = f"""
        <div class="customer-card" onclick="window.location.href='{filename}'">
            <div class="customer-rank">#{customer['rank']}</div>
            <h3 class="customer-name">{customer['customer_name']}</h3>
            <div class="customer-metrics">
                <div class="metric">
                    <div class="metric-label">Total Revenue</div>
                    <div class="metric-value">${customer['total']/1000000:.2f}M</div>
                </div>
                <div class="metric">
                    <div class="metric-label">RR / NRR</div>
                    <div class="metric-value">${customer['rr']/1000000:.1f}M / ${customer['nrr']/1000000:.1f}M</div>
                </div>
                <div class="metric">
                    <div class="metric-label">% of Total</div>
                    <div class="metric-value">{customer['pct_of_total']:.1f}%</div>
                </div>
            </div>
            <span class="badge {badge_class}">{badge_text}</span>
        </div>
        """
        cards.append(card)

    return ''.join(cards)

def generate_index_html(data):
    """Generate the NewNet BU index HTML."""
    customers = data['customers']

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewNet Customer Overview | Skyvera</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --ink: #1a1a1a;
            --paper: #fafaf8;
            --accent: #388e3c;
            --secondary: #2d4263;
            --muted: #8b8b8b;
            --border: #e8e6e1;
            --highlight: #e8f5e9;
        }}

        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); line-height: 1.6; }}
        h1, h2 {{ font-family: 'Cormorant Garamond', serif; }}

        .global-nav {{
            background: var(--ink);
            color: var(--paper);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }}
        .global-nav h1 {{
            font-size: 1.5rem;
            font-weight: 400;
        }}
        .bu-selector {{
            display: flex;
            gap: 1rem;
            margin-top: 0.5rem;
        }}
        .bu-link {{
            color: var(--paper);
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: all 0.2s;
            opacity: 0.7;
        }}
        .bu-link:hover {{
            opacity: 1;
            background: rgba(255,255,255,0.1);
        }}
        .bu-link.active {{
            opacity: 1;
            background: var(--accent);
        }}

        .header {{
            background: linear-gradient(135deg, var(--accent) 0%, #1b5e20 100%);
            color: var(--paper);
            padding: 4rem 2rem 3rem;
            text-align: center;
        }}
        .header h1 {{
            font-size: 3.5rem;
            font-weight: 300;
            margin-bottom: 1rem;
        }}
        .header-stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 2rem auto 0;
        }}
        .stat-card {{
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 4px;
            text-align: center;
        }}
        .stat-label {{
            font-size: 0.85rem;
            text-transform: uppercase;
            opacity: 0.8;
            margin-bottom: 0.5rem;
        }}
        .stat-value {{
            font-size: 2rem;
            font-weight: 700;
        }}

        .container {{
            max-width: 1400px;
            margin: 3rem auto;
            padding: 0 2rem;
        }}

        .search-bar {{
            margin: 2rem 0;
            text-align: center;
        }}
        .search-input {{
            padding: 1rem 1.5rem;
            font-size: 1.1rem;
            border: 2px solid var(--border);
            border-radius: 8px;
            width: 100%;
            max-width: 600px;
        }}

        .customer-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }}

        .customer-card {{
            background: white;
            border: 2px solid var(--border);
            padding: 2rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }}
        .customer-card:hover {{
            border-color: var(--accent);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            transform: translateY(-4px);
        }}

        .customer-rank {{
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: var(--accent);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-weight: 700;
            font-size: 1.2rem;
        }}

        .customer-name {{
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            color: var(--secondary);
            padding-right: 4rem;
        }}

        .customer-metrics {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
        }}
        .metric {{
            text-align: center;
        }}
        .metric-label {{
            font-size: 0.75rem;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 0.25rem;
        }}
        .metric-value {{
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--ink);
        }}

        .badge {{
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
        }}
        .badge-critical {{ background: #e53935; color: white; }}
        .badge-high {{ background: #ff9800; color: white; }}
        .badge-medium {{ background: #ffc107; color: #1a1a1a; }}

        .footer {{
            background: var(--secondary);
            color: var(--paper);
            text-align: center;
            padding: 2rem;
            margin-top: 4rem;
        }}

        @media (max-width: 768px) {{
            .header h1 {{ font-size: 2.5rem; }}
            .customer-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <nav class="global-nav">
        <h1>Skyvera Customer Account Planning</h1>
        <div class="bu-selector">
            <a href="../index.html" class="bu-link">CloudSense</a>
            <a href="../kandy/index.html" class="bu-link">Kandy</a>
            <a href="../stl/index.html" class="bu-link">STL</a>
            <a href="index.html" class="bu-link active">NewNet</a>
        </div>
    </nav>

    <div class="header">
        <h1>NewNet Business Unit</h1>
        <p style="font-size: 1.2rem; margin-top: 1rem; opacity: 0.9;">Strategic Account Overview | Q1 2026</p>

        <div class="header-stats">
            <div class="stat-card">
                <div class="stat-label">Total Customers</div>
                <div class="stat-value">{data['top_80_count']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${data['total_revenue']/1000000:.1f}M</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Top 80% Revenue</div>
                <div class="stat-value">${data['top_80_revenue']/1000000:.1f}M</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Coverage</div>
                <div class="stat-value">{(data['top_80_revenue']/data['total_revenue']*100):.0f}%</div>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="search-bar">
            <input type="text" class="search-input" placeholder="Search customers..." onkeyup="filterCustomers(this.value)">
        </div>

        <h2 style="margin: 3rem 0 1rem;">Top 80% Customer Accounts</h2>
        <p style="color: var(--muted); margin-bottom: 2rem;">Click any customer card to view their detailed account plan</p>

        <div class="customer-grid" id="customerGrid">
            {generate_customer_cards(customers)}
        </div>
    </div>

    <div class="footer">
        <p><strong>Skyvera Customer Account Planning System</strong></p>
        <p style="margin-top: 0.5rem; opacity: 0.8;">NewNet Business Unit | Generated: {datetime.now().strftime('%B %Y')}</p>
    </div>

    <script>
        function filterCustomers(query) {{
            const cards = document.querySelectorAll('.customer-card');
            const lowerQuery = query.toLowerCase();

            cards.forEach(card => {{
                const name = card.querySelector('.customer-name').textContent.toLowerCase();
                if (name.includes(lowerQuery)) {{
                    card.style.display = 'block';
                }} else {{
                    card.style.display = 'none';
                }}
            }});
        }}
    </script>
</body>
</html>"""

    return html

def main():
    data = load_customers()
    html = generate_index_html(data)

    with open('output/newnet/index.html', 'w') as f:
        f.write(html)

    print("="*100)
    print("✅ NewNet BU index page generated")
    print("📁 Saved to: output/newnet/index.html")
    print("="*100)
    print("\nOpen with: open output/newnet/index.html")

if __name__ == '__main__':
    main()
