#!/usr/bin/env python3
"""Generate rich, top-tier account plan dashboards with full intelligence in all tabs."""

import json
import os
import re
from datetime import datetime

def load_customers(bu):
    bu_files = {
        'CloudSense': 'data/customers_cloudsense_all.json',
        'Kandy': 'data/customers_kandy_all.json',
        'STL': 'data/customers_stl_all.json',
        'NewNet': 'data/customers_newnet_all.json'
    }
    with open(bu_files[bu], 'r') as f:
        return json.load(f)['customers']

def load_intelligence_report(customer_name):
    filename = f"{customer_name.replace('/', '-').replace(' ', '_')}.md"
    filepath = f"data/intelligence/reports/{filename}"
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return f.read()
    return None

def load_intelligence_html():
    filepath = 'data/intelligence_html.json'
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return {}

def get_intelligence_html(customer_name, intelligence_data):
    customer_key = customer_name.replace('/', '-').replace(' ', '_')
    if customer_key in intelligence_data:
        return intelligence_data[customer_key]
    
    customer_key_no_underscore = customer_name.replace('/', ' ').replace('  ', ' ')
    for key in intelligence_data.keys():
        if key.replace('_', ' ').lower() == customer_key_no_underscore.lower():
            return intelligence_data[key]
    return None

def md_to_html(text):
    """Quick markdown to HTML converter."""
    if not text:
        return ""
    html = text
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'^\- (.+?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = html.replace('\n\n', '</p><p>')
    html = '<p>' + html + '</p>'
    html = re.sub(r'<p>(<li>.*?</li>)+</p>', r'<ul>\1</ul>', html, flags=re.DOTALL)
    return html

def parse_section(text, section_name):
    """Extract a markdown section by heading name."""
    pattern = f'## {re.escape(section_name)}\\s*\\n(.*?)(?=\\n## |\\Z)'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""

def parse_subsection(text, subsection_name):
    """Extract a markdown subsection by heading name."""
    pattern = f'### {re.escape(subsection_name)}\\s*\\n(.*?)(?=\\n### |\\n## |\\Z)'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""

def extract_executives(text):
    """Extract executives from table."""
    execs = []
    pattern = r'\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+?) \|'
    matches = re.findall(pattern, text)
    for role, name, background, tenure in matches:
        if role.strip() and name.strip() and 'Role' not in role:
            execs.append({
                'role': role.strip(),
                'name': name.strip(),
                'background': background.strip(),
                'tenure': tenure.strip()
            })
    return execs

def extract_risks(text):
    """Extract risks from table."""
    risks = []
    pattern = r'\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|'
    matches = re.findall(pattern, text)
    for risk, prob, impact, sev, mit in matches:
        if risk.strip() and 'Risk' not in risk:
            risks.append({
                'risk': risk.strip(),
                'probability': prob.strip(),
                'impact': impact.strip(),
                'severity': sev.strip(),
                'mitigation': mit.strip()
            })
    return risks

def extract_actions(text, section_name):
    """Extract action items from table."""
    actions = []
    section = parse_subsection(text, section_name)
    pattern = r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|'
    matches = re.findall(pattern, section)
    for priority, title, detail, owner, metric in matches:
        actions.append({
            'priority': priority,
            'title': title.strip(),
            'detail': detail.strip(),
            'owner': owner.strip(),
            'metric': metric.strip()
        })
    return actions

def generate_complete_dashboard(customer, all_customers, bu_name, intelligence_html_data):
    """Generate complete dashboard with all tabs populated."""
    customer_name = customer['customer_name']
    
    # Load intelligence
    intelligence_html = get_intelligence_html(customer_name, intelligence_html_data)
    intelligence_report = load_intelligence_report(customer_name)
    has_intelligence = intelligence_report is not None
    
    # Parse intelligence sections
    if has_intelligence:
        exec_section = parse_section(intelligence_report, "Executive Leadership")
        executives = extract_executives(exec_section)
        
        pain_section = parse_section(intelligence_report, "Pain Points & Challenges")
        comp_section = parse_section(intelligence_report, "Competitive Landscape")
        strategic_section = parse_section(intelligence_report, "Strategic Direction")
        financial_section = parse_section(intelligence_report, "Financial Analysis")
        
        risk_assessment = parse_subsection(intelligence_report, "Risk Assessment Matrix")
        risks = extract_risks(risk_assessment)
        
        immediate_actions = extract_actions(intelligence_report, "Immediate Actions (0-30 Days)")
        shortterm_actions = extract_actions(intelligence_report, "Short-Term Actions (30-90 Days)")
        strategic_actions = extract_actions(intelligence_report, "Strategic Actions (90+ Days)")
        
        org_structure = parse_subsection(intelligence_report, "Key Stakeholders for CloudSense Relationship")
        
        # Extract alerts and keys to success
        alerts = []
        findings = re.findall(r'\d+\.\s+\*\*(CAUTION|CRITICAL|RISK):\*\*\s+(.+?)(?=\n\d+\.|\n\n|\Z)', intelligence_report, re.DOTALL)
        for severity, text in findings[:2]:
            alerts.append({'severity': severity, 'text': text.strip()})
        
        keys_to_success = []
        for action in (immediate_actions + shortterm_actions)[:3]:
            keys_to_success.append(action)
    else:
        executives = []
        pain_section = comp_section = strategic_section = financial_section = ""
        risks = []
        immediate_actions = shortterm_actions = strategic_actions = []
        org_structure = ""
        alerts = []
        keys_to_success = []
    
    # Generate HTML
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
    {generate_nav(all_customers, customer_name, bu_name)}
    {generate_header(customer, bu_name)}
    {generate_tabs()}
    
    {generate_overview_tab(customer, intelligence_html, alerts, keys_to_success, bu_name)}
    {generate_executives_tab(executives, org_structure)}
    {generate_org_tab(strategic_section)}
    {generate_pain_tab(pain_section, risks)}
    {generate_competitive_tab(comp_section)}
    {generate_action_tab(immediate_actions, shortterm_actions, strategic_actions)}
    {generate_financial_tab(financial_section)}
    
    {generate_footer(customer_name, bu_name)}
    {generate_javascript()}
</body>
</html>"""
    
    return html

def generate_css():
    return """<style>
    :root {
        --ink: #1a1a1a; --paper: #fafaf8; --accent: #c84b31; --secondary: #2d4263;
        --muted: #8b8b8b; --border: #e8e6e1; --highlight: #ecdbba;
        --success: #4caf50; --warning: #ff9800; --critical: #e53935;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); line-height: 1.6; }
    h1, h2, h3 { font-family: 'Cormorant Garamond', serif; font-weight: 600; line-height: 1.2; }
    h1 { font-size: 3.5rem; font-weight: 300; }
    h2 { font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--secondary); }
    h3 { font-size: 1.25rem; margin-bottom: 1rem; }
    
    .global-nav { background: var(--ink); color: var(--paper); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .global-nav-logo { font-size: 1.5rem; font-weight: 700; color: var(--accent); text-decoration: none; }
    .global-nav-select { padding: 0.75rem 1.5rem; font-size: 0.95rem; border: 1px solid var(--border); border-radius: 4px; background: white; min-width: 400px; }
    
    .header { background: linear-gradient(135deg, var(--secondary) 0%, #1a2332 100%); color: var(--paper); padding: 4rem 2rem 3rem; }
    .header-content { max-width: 1400px; margin: 0 auto; }
    .subtitle { font-size: 1.1rem; opacity: 0.85; margin-bottom: 2rem; }
    .header-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 2rem; }
    .stat-card { background: rgba(255,255,255,0.08); padding: 1.5rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
    .stat-label { font-size: 0.85rem; text-transform: uppercase; opacity: 0.7; margin-bottom: 0.5rem; }
    .stat-value { font-size: 2rem; font-family: 'Cormorant Garamond', serif; font-weight: 600; }
    
    .nav-tabs { max-width: 1400px; margin: 0 auto; padding: 0 2rem; background: white; border-bottom: 2px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .nav-tabs-list { display: flex; gap: 0; list-style: none; overflow-x: auto; }
    .nav-tab { padding: 1.25rem 2rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; white-space: nowrap; font-weight: 500; color: var(--muted); }
    .nav-tab:hover { color: var(--secondary); background: var(--highlight); }
    .nav-tab.active { color: var(--accent); border-bottom-color: var(--accent); background: rgba(200,75,49,0.05); }
    
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .container { max-width: 1400px; margin: 3rem auto; padding: 0 2rem; }
    .card { background: white; border: 1px solid var(--border); padding: 2rem; margin-bottom: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-radius: 4px; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
    .metric-box { background: var(--highlight); padding: 1.5rem; border-left: 3px solid var(--accent); }
    .metric-box .label { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem; text-transform: uppercase; }
    .metric-box .value { font-size: 1.8rem; font-family: 'Cormorant Garamond', serif; font-weight: 600; color: var(--secondary); }
    
    .alert-banner { background: linear-gradient(135deg, var(--critical) 0%, #c62828 100%); color: white; padding: 1.5rem 2rem; margin: 0 0 2rem; border-left: 4px solid #8b1a1a; box-shadow: 0 4px 12px rgba(229,57,53,0.3); border-radius: 4px; }
    .alert-banner h3 { color: white; margin-bottom: 0.75rem; font-size: 1.3rem; }
    .alert-banner p { margin: 0.5rem 0 0; line-height: 1.6; opacity: 0.95; }
    
    .keys-to-success { background: linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(76,175,80,0.02) 100%); border: 1px solid rgba(76,175,80,0.2); padding: 2rem; margin: 0 0 2rem; border-radius: 4px; }
    .keys-to-success h2 { color: #2e7d32; margin-bottom: 1.5rem; }
    .priority-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .priority-card { background: white; padding: 1.5rem; border-left: 4px solid #4caf50; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 4px; }
    .priority-card .priority-label { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #4caf50; margin-bottom: 0.75rem; }
    .priority-card .priority-action { font-size: 1.15rem; font-family: 'Cormorant Garamond', serif; font-weight: 600; color: var(--secondary); line-height: 1.4; }
    
    .exec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .exec-card { background: var(--paper); border: 1px solid var(--border); padding: 1.5rem; border-radius: 4px; border-left: 4px solid var(--accent); }
    .exec-role { font-size: 0.85rem; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 0.5rem; }
    .exec-name { font-size: 1.3rem; font-family: 'Cormorant Garamond', serif; font-weight: 600; margin-bottom: 1rem; color: var(--secondary); }
    .exec-detail { font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--ink); }
    
    .data-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    .data-table th { background: var(--secondary); color: white; padding: 1rem; text-align: left; font-weight: 600; }
    .data-table td { padding: 1rem; border-bottom: 1px solid var(--border); }
    .data-table tr:hover { background: var(--highlight); }
    .priority-col { font-weight: 700; color: var(--accent); }
    
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 3px; font-size: 0.85rem; font-weight: 600; }
    .badge-high, .badge-critical { background: rgba(229,57,53,0.2); color: #c62828; }
    .badge-medium { background: rgba(255,152,0,0.2); color: #e65100; }
    
    .pending-notice { background: rgba(255,152,0,0.1); border-left: 4px solid #ff9800; padding: 2rem; margin: 2rem 0; border-radius: 4px; }
    
    .footer { background: var(--secondary); color: var(--paper); text-align: center; padding: 2rem; margin-top: 4rem; }
    </style>"""

def generate_nav(all_customers, current, bu):
    options = []
    for c in all_customers:
        filename = c['customer_name'].replace('/', '-').replace(' ', '_') + '.html'
        selected = ' selected' if c['customer_name'] == current else ''
        options.append(f'<option value="{filename}"{selected}>#{c["rank"]} - {c["customer_name"]} (${c["total"]/1000000:.2f}M)</option>')
    
    return f"""<div class="global-nav">
        <a href="../index.html" class="global-nav-logo">SKYVERA</a>
        <div><select class="global-nav-select" onchange="window.location.href=this.value">
            <option value="">Select Customer...</option>
            {''.join(options)}
        </select></div>
    </div>"""

def generate_header(customer, bu):
    return f"""<div class="header">
        <div class="header-content">
            <h1>{customer['customer_name']}</h1>
            <div class="subtitle">Strategic Account Plan | {bu} Business Unit | Q1 2026</div>
            <div class="header-stats">
                <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${customer['total']/1000000:.2f}M</div></div>
                <div class="stat-card"><div class="stat-label">Recurring Revenue</div><div class="stat-value">${customer['rr']/1000000:.2f}M</div></div>
                <div class="stat-card"><div class="stat-label">Non-Recurring Revenue</div><div class="stat-value">${customer['nrr']/1000000:.2f}M</div></div>
                <div class="stat-card"><div class="stat-label">Customer Rank</div><div class="stat-value">#{customer['rank']}</div></div>
            </div>
        </div>
    </div>"""

def generate_tabs():
    return """<div class="nav-tabs"><ul class="nav-tabs-list">
        <li class="nav-tab active" onclick="showTab('overview')">📊 Overview</li>
        <li class="nav-tab" onclick="showTab('executives')">👔 Key Executives</li>
        <li class="nav-tab" onclick="showTab('org-chart')">🏢 Org Structure</li>
        <li class="nav-tab" onclick="showTab('pain-points')">💡 Pain Points</li>
        <li class="nav-tab" onclick="showTab('competitive')">⚔️ Competitive</li>
        <li class="nav-tab" onclick="showTab('action-plan')">📋 Action Plan</li>
        <li class="nav-tab" onclick="showTab('financial')">💰 Financial</li>
    </ul></div>"""

def generate_overview_tab(customer, intelligence_html, alerts, keys, bu):
    rr_pct = (customer['rr']/customer['total']*100) if customer['total'] > 0 else 0
    nrr_pct = (customer['nrr']/customer['total']*100) if customer['total'] > 0 else 0
    
    alerts_html = ''.join([f'''
    <div class="alert-banner">
        <h3>🚨 {alert["severity"].upper()}: {alert["text"][:80]}{'...' if len(alert["text"]) > 80 else ''}</h3>
        <p>{alert["text"]}</p>
    </div>''' for alert in alerts])
    
    keys_html = ""
    if keys:
        cards = ''.join([f'''
            <div class="priority-card">
                <div class="priority-label">Priority #{k["priority"]}</div>
                <div class="priority-action">{k["title"]}</div>
            </div>''' for k in keys])
        keys_html = f'''<div class="keys-to-success">
            <h2>🎯 Keys to Success in Next 90 Days</h2>
            <div class="priority-grid">{cards}</div>
        </div>'''
    
    intel_section = intelligence_html if intelligence_html else '''
    <div class="pending-notice">
        <h2>⏳ Intelligence In Progress</h2>
        <p>Comprehensive account intelligence will be available once research is complete.</p>
    </div>'''
    
    return f'''<div id="overview" class="tab-content active">
        <div class="container">
            {alerts_html}
            {keys_html}
            {intel_section}
            <div class="card">
                <h2>Revenue Breakdown</h2>
                <table class="data-table">
                    <tr><th>Component</th><th style="text-align:right">Amount</th><th style="text-align:right">% of Total</th></tr>
                    <tr><td><strong>Recurring Revenue (ARR)</strong></td><td style="text-align:right">${customer['rr']:,.0f}</td><td style="text-align:right">{rr_pct:.1f}%</td></tr>
                    <tr><td><strong>Non-Recurring Revenue (FY26)</strong></td><td style="text-align:right">${customer['nrr']:,.0f}</td><td style="text-align:right">{nrr_pct:.1f}%</td></tr>
                    <tr style="background:var(--highlight)"><td><strong>TOTAL REVENUE</strong></td><td style="text-align:right"><strong>${customer['total']:,.0f}</strong></td><td style="text-align:right"><strong>100.0%</strong></td></tr>
                </table>
            </div>
        </div>
    </div>'''

def generate_executives_tab(executives, org):
    if not executives:
        return '''<div id="executives" class="tab-content"><div class="container">
            <div class="pending-notice"><h2>⏳ Executive Intelligence In Progress</h2>
            <p>Detailed executive profiles will be available once research is complete.</p></div>
        </div></div>'''
    
    exec_cards = ''.join([f'''
    <div class="exec-card">
        <div class="exec-role">{e["role"]}</div>
        <div class="exec-name">{e["name"]}</div>
        <div class="exec-detail"><strong>Background:</strong> {e["background"]}</div>
        <div class="exec-detail"><strong>Tenure:</strong> {e["tenure"]}</div>
    </div>''' for e in executives])
    
    org_section = f'<div class="card"><h2>Key Stakeholders</h2>{md_to_html(org)}</div>' if org else ''
    
    return f'''<div id="executives" class="tab-content"><div class="container">
        <div class="card"><h2>Executive Leadership</h2><div class="exec-grid">{exec_cards}</div></div>
        {org_section}
    </div></div>'''

def generate_org_tab(strategic):
    if not strategic:
        return '''<div id="org-chart" class="tab-content"><div class="container">
            <div class="pending-notice"><h2>⏳ Organizational Intelligence In Progress</h2>
            <p>Strategic direction and organizational structure will be available once research is complete.</p></div>
        </div></div>'''
    
    return f'''<div id="org-chart" class="tab-content"><div class="container">
        <div class="card"><h2>Strategic Direction</h2>{md_to_html(strategic)}</div>
    </div></div>'''

def generate_pain_tab(pain_text, risks):
    if not pain_text and not risks:
        return '''<div id="pain-points" class="tab-content"><div class="container">
            <div class="pending-notice"><h2>⏳ Challenge Analysis In Progress</h2>
            <p>Pain point analysis will be available once research is complete.</p></div>
        </div></div>'''
    
    pain_section = f'<div class="card"><h2>Pain Points & Challenges</h2>{md_to_html(pain_text)}</div>' if pain_text else ''
    
    risk_section = ""
    if risks:
        rows = ''.join([f'''<tr>
            <td><strong>{r["risk"]}</strong></td>
            <td>{r["probability"]}</td>
            <td>{r["impact"]}</td>
            <td><span class="badge badge-{r["severity"].lower().replace(" ", "-")}">{r["severity"]}</span></td>
        </tr>''' for r in risks])
        risk_section = f'''<div class="card"><h2>Risk Assessment</h2>
        <table class="data-table">
            <thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Severity</th></tr></thead>
            <tbody>{rows}</tbody>
        </table></div>'''
    
    return f'''<div id="pain-points" class="tab-content"><div class="container">
        {pain_section}{risk_section}
    </div></div>'''

def generate_competitive_tab(comp):
    if not comp:
        return '''<div id="competitive" class="tab-content"><div class="container">
            <div class="pending-notice"><h2>⏳ Competitive Analysis In Progress</h2>
            <p>Competitive landscape analysis will be available once research is complete.</p></div>
        </div></div>'''
    
    return f'''<div id="competitive" class="tab-content"><div class="container">
        <div class="card"><h2>Competitive Landscape</h2>{md_to_html(comp)}</div>
    </div></div>'''

def generate_action_tab(immediate, shortterm, strategic):
    if not any([immediate, shortterm, strategic]):
        return '''<div id="action-plan" class="tab-content"><div class="container">
            <div class="pending-notice"><h2>⏳ Action Plan In Progress</h2>
            <p>Strategic action items will be available once research is complete.</p></div>
        </div></div>'''
    
    sections = []
    
    if immediate:
        rows = ''.join([f'''<tr>
            <td class="priority-col">#{a["priority"]}</td>
            <td><strong>{a["title"]}</strong> - {a["detail"]}</td>
            <td>{a["owner"]}</td>
            <td>{a["metric"]}</td>
        </tr>''' for a in immediate])
        sections.append(f'''<div class="card"><h2>🔥 Immediate Actions (0-30 Days)</h2>
        <table class="data-table">
            <thead><tr><th>Priority</th><th>Action</th><th>Owner</th><th>Success Metric</th></tr></thead>
            <tbody>{rows}</tbody>
        </table></div>''')
    
    if shortterm:
        rows = ''.join([f'''<tr>
            <td class="priority-col">#{a["priority"]}</td>
            <td><strong>{a["title"]}</strong> - {a["detail"]}</td>
            <td>{a["owner"]}</td>
            <td>{a["metric"]}</td>
        </tr>''' for a in shortterm])
        sections.append(f'''<div class="card"><h2>📅 Short-Term Actions (30-90 Days)</h2>
        <table class="data-table">
            <thead><tr><th>Priority</th><th>Action</th><th>Owner</th><th>Success Metric</th></tr></thead>
            <tbody>{rows}</tbody>
        </table></div>''')
    
    if strategic:
        rows = ''.join([f'''<tr>
            <td class="priority-col">#{a["priority"]}</td>
            <td><strong>{a["title"]}</strong> - {a["detail"]}</td>
            <td>{a["owner"]}</td>
            <td>{a["metric"]}</td>
        </tr>''' for a in strategic])
        sections.append(f'''<div class="card"><h2>🎯 Strategic Actions (90+ Days)</h2>
        <table class="data-table">
            <thead><tr><th>Priority</th><th>Action</th><th>Owner</th><th>Success Metric</th></tr></thead>
            <tbody>{rows}</tbody>
        </table></div>''')
    
    return f'''<div id="action-plan" class="tab-content"><div class="container">
        {''.join(sections)}
    </div></div>'''

def generate_financial_tab(financial):
    if not financial:
        return '''<div id="financial" class="tab-content"><div class="container">
            <div class="pending-notice"><h2>⏳ Financial Analysis In Progress</h2>
            <p>Detailed financial analysis will be available once research is complete.</p></div>
        </div></div>'''
    
    return f'''<div id="financial" class="tab-content"><div class="container">
        <div class="card"><h2>Financial Analysis</h2>{md_to_html(financial)}</div>
    </div></div>'''

def generate_footer(customer, bu):
    return f'''<div class="footer">
        <p><strong>{customer} Strategic Account Plan</strong> | {bu} Business Unit | Skyvera</p>
        <p style="margin-top:0.5rem">Generated: {datetime.now().strftime("%B %d, %Y")} | Confidential - Internal Use Only</p>
    </div>'''

def generate_javascript():
    return '''<script>
    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        event.target.classList.add('active');
    }
    </script>'''

def main():
    print("="*100)
    print("GENERATING PREMIUM ACCOUNT PLAN DASHBOARDS WITH RICH CONTENT")
    print("="*100)
    
    bus = {
        'CloudSense': 'output',
        'Kandy': 'output/kandy',
        'STL': 'output/stl',
        'NewNet': 'output/newnet'
    }
    
    intelligence_html_data = load_intelligence_html()
    print(f"Loaded intelligence HTML for {len(intelligence_html_data)} customers\n")
    
    total = 0
    for bu_name, output_dir in bus.items():
        print(f"\n{bu_name}:")
        print("-" * 80)
        
        customers = load_customers(bu_name)
        os.makedirs(output_dir, exist_ok=True)
        
        for customer in customers:
            customer_name = customer['customer_name']
            filename = customer_name.replace('/', '-').replace(' ', '_') + '.html'
            filepath = f"{output_dir}/{filename}"
            
            html = generate_complete_dashboard(customer, customers, bu_name, intelligence_html_data)
            
            with open(filepath, 'w') as f:
                f.write(html)
            
            report = load_intelligence_report(customer_name)
            has_intel = '📊' if report else '  '
            print(f"  #{customer['rank']:<3} {has_intel} {customer_name[:60]:<60} → {filename}")
            total += 1
        
        print(f"  ✅ Generated {len(customers)} {bu_name} dashboards")
    
    print("\n" + "="*100)
    print(f"✅ Generated {total} premium account plan dashboards with rich content in all tabs")
    print("="*100)

if __name__ == '__main__':
    main()
