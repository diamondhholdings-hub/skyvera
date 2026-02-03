"""Generate HTML dashboards for all Kandy customers."""
import json
import os
from datetime import datetime

def load_customers():
    with open('data/customers_kandy_top80.json', 'r') as f:
        return json.load(f)

def load_template():
    with open('templates/account_plan_base.html', 'r') as f:
        return f.read()

def generate_customer_dropdown_options(all_customers, current_customer_name):
    """Generate <option> tags for customer selector dropdown."""
    options = []
    for customer in all_customers:
        filename = customer['customer_name'].replace('/', '-').replace(' ', '_') + '.html'
        selected = ' selected' if customer['customer_name'] == current_customer_name else ''
        options.append(
            f'<option value="{filename}"{selected}>#{customer["rank"]} - {customer["customer_name"]} (${customer["total"]/1000000:.2f}M)</option>'
        )
    return '\n'.join(options)

def load_customer_news(customer_name):
    """Load news data for customer if available."""
    filename = f"{customer_name.replace('/', '-').replace(' ', '_')}_news.json"
    filepath = f"data/news/kandy/{filename}"

    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return None

def generate_news_widget(customer_name, news_data):
    """Generate news widget HTML."""
    if not news_data or news_data['article_count'] == 0:
        return """
        <div class="card">
            <h2>📰 Recent News & Updates</h2>
            <div style="text-align: center; padding: 3rem; color: var(--muted); font-style: italic;">
                No recent news available for this customer
            </div>
        </div>
        """

    articles_html = ''
    for article in news_data['articles']:
        relevance_class = 'relevance-high' if article['relevance_score'] >= 0.7 else 'relevance-medium'
        relevance_label = 'High Relevance' if article['relevance_score'] >= 0.7 else 'Medium Relevance'

        articles_html += f"""
        <div class="news-article">
            <div class="news-title">
                <a href="{article['url']}" target="_blank" rel="noopener">{article['title']}</a>
            </div>
            <div class="news-meta">
                <span class="news-source">{article['source']}</span>
                <span>•</span>
                <span>{article['published']}</span>
                <span>•</span>
                <span class="news-relevance {relevance_class}">{relevance_label}</span>
            </div>
            {f'<div class="news-summary">{article["summary"]}</div>' if article.get('summary') else ''}
        </div>
        """

    widget_html = f"""
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">📰 Recent News & Updates</h2>
            <div style="font-size: 0.85rem; color: var(--muted);">
                Last updated: {news_data['last_updated']}
            </div>
        </div>

        <div class="news-articles">
            {articles_html}
        </div>
    </div>

    <style>
        .news-article {{
            padding: 1.25rem;
            margin-bottom: 1rem;
            background: white;
            border-left: 4px solid var(--accent);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
        }}
        .news-article:hover {{
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateX(4px);
        }}
        .news-title {{
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }}
        .news-title a {{
            color: var(--secondary);
            text-decoration: none;
        }}
        .news-title a:hover {{
            color: var(--accent);
            text-decoration: underline;
        }}
        .news-meta {{
            display: flex;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: var(--muted);
            margin-bottom: 0.5rem;
            flex-wrap: wrap;
        }}
        .news-source {{
            font-weight: 600;
        }}
        .news-relevance {{
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.75rem;
            font-weight: 600;
        }}
        .relevance-high {{
            background: rgba(76, 175, 80, 0.2);
            color: #2e7d32;
        }}
        .relevance-medium {{
            background: rgba(255, 152, 0, 0.2);
            color: #e65100;
        }}
        .news-summary {{
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--ink);
        }}
    </style>
    """

    return widget_html

def create_simple_dashboard(customer, all_customers):
    """Create a simplified dashboard for customers without full intelligence."""
    customer_name = customer['customer_name']
    news_data = load_customer_news(customer_name)
    news_widget = generate_news_widget(customer_name, news_data)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{customer_name} Account Plan | Skyvera Kandy</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --ink: #1a1a1a;
            --paper: #fafaf8;
            --accent: #e65100;
            --secondary: #2d4263;
            --muted: #8b8b8b;
            --border: #e8e6e1;
            --highlight: #fff3e0;
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
        .global-nav-bu-selector {{
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: white;
            cursor: pointer;
            min-width: 200px;
        }}
        .global-nav-select {{
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: white;
            cursor: pointer;
            min-width: 400px;
        }}

        .header {{
            background: linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%);
            color: var(--paper);
            padding: 4rem 2rem 3rem;
        }}
        .header-content {{
            max-width: 1400px;
            margin: 0 auto;
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
            margin-top: 2rem;
        }}
        .stat-card {{
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 4px;
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
        .card {{
            background: white;
            border: 1px solid var(--border);
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }}
        .back-link {{
            display: inline-block;
            margin: 1rem 2rem;
            padding: 0.75rem 1.5rem;
            background: var(--secondary);
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }}
        .back-link:hover {{
            background: var(--accent);
        }}

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

        .pending-notice {{
            background: rgba(255, 152, 0, 0.1);
            border-left: 4px solid #ff9800;
            padding: 2rem;
            margin: 2rem 0;
        }}

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
    <div class="global-nav">
        <a href="../index.html" class="global-nav-logo">SKYVERA</a>
        <div class="global-nav-controls">
            <select class="global-nav-bu-selector" onchange="window.location.href=this.value">
                <option value="">Switch Business Unit...</option>
                <option value="../output/index.html">CloudSense</option>
                <option value="index.html" selected>Kandy</option>
                <option value="../stl/index.html">STL</option>
                <option value="../newnet/index.html">NewNet</option>
            </select>
            <select class="global-nav-select" onchange="window.location.href=this.value">
                <option value="">Select Customer Account...</option>
                {generate_customer_dropdown_options(all_customers, customer_name)}
            </select>
        </div>
    </div>

    <a href="index.html" class="back-link">← Back to Customer Overview</a>

    <div class="header">
        <div class="header-content">
            <h1>{customer_name}</h1>
            <div style="font-size: 1.1rem; opacity: 0.85; margin-top: 1rem;">
                Strategic Account Plan | Kandy Business Unit | Q1 2026
            </div>

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

    <div class="container">
        <div class="pending-notice">
            <h2 style="margin-bottom: 1rem;">⏳ Account Intelligence In Progress</h2>
            <p>Comprehensive account plan intelligence (executives, pain points, competitive analysis, opportunities) will be populated here once customer research is complete.</p>
            <p style="margin-top: 1rem;"><strong>Status:</strong> Awaiting customer-intelligence-analyst research for {customer_name}</p>
        </div>

        <div class="card">
            <h2>Account Overview</h2>
            <div class="metrics-grid">
                <div class="metric-box">
                    <div class="label">Business Unit</div>
                    <div class="value" style="font-size: 1.2rem;">Kandy</div>
                </div>
                <div class="metric-box">
                    <div class="label">Active Subscriptions</div>
                    <div class="value">{len(customer['subscriptions'])}</div>
                </div>
                <div class="metric-box">
                    <div class="label">% of Kandy</div>
                    <div class="value">{customer['pct_of_total']:.1f}%</div>
                </div>
                <div class="metric-box">
                    <div class="label">Revenue Mix</div>
                    <div class="value" style="font-size: 1rem;">
                        {(customer['rr']/customer['total']*100) if customer['total'] > 0 else 0:.0f}% RR /
                        {(customer['nrr']/customer['total']*100) if customer['total'] > 0 else 0:.0f}% NRR
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
                    <td style="text-align: right; padding: 1rem;">{(customer['rr']/customer['total']*100) if customer['total'] > 0 else 0:.1f}%</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 1rem;"><strong>Non-Recurring Revenue (FY26)</strong></td>
                    <td style="text-align: right; padding: 1rem;">${customer['nrr']:,.0f}</td>
                    <td style="text-align: right; padding: 1rem;">{(customer['nrr']/customer['total']*100) if customer['total'] > 0 else 0:.1f}%</td>
                </tr>
                <tr style="background: var(--highlight); font-weight: 700;">
                    <td style="padding: 1rem;"><strong>TOTAL REVENUE</strong></td>
                    <td style="text-align: right; padding: 1rem;">${customer['total']:,.0f}</td>
                    <td style="text-align: right; padding: 1rem;">100.0%</td>
                </tr>
            </table>
        </div>

        {news_widget}
    </div>

    <div class="footer">
        <p><strong>{customer_name} Strategic Account Plan</strong> | Kandy Business Unit | Skyvera</p>
        <p style="margin-top: 0.5rem;">Generated: {datetime.now().strftime('%B %d, %Y')} | Confidential - Internal Use Only</p>
    </div>
</body>
</html>"""

    return html

def main():
    data = load_customers()
    customers = data['customers']

    os.makedirs('output/kandy', exist_ok=True)

    print("="*100)
    print("GENERATING KANDY CUSTOMER ACCOUNT PLAN DASHBOARDS")
    print("="*100)
    print(f"\nTotal customers: {len(customers)}\n")

    for customer in customers:
        customer_name = customer['customer_name']
        filename = customer_name.replace('/', '-').replace(' ', '_') + '.html'
        filepath = f"output/kandy/{filename}"

        html = create_simple_dashboard(customer, customers)

        with open(filepath, 'w') as f:
            f.write(html)

        print(f"#{customer['rank']:<3} {customer_name[:55]:<55} → {filename}")

    print("\n" + "="*100)
    print(f"✅ Generated {len(customers)} Kandy customer dashboards")
    print(f"📁 Saved to: output/kandy/")
    print("="*100)

if __name__ == '__main__':
    main()
