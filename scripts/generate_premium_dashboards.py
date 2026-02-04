#!/usr/bin/env python3
"""Generate premium account plan dashboards with rich content in all tabs."""

import json
import os
import sys
from datetime import datetime

# Import the intelligence parser
sys.path.insert(0, os.path.dirname(__file__))
from parse_intelligence_for_tabs import parse_intelligence_report, markdown_to_html

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

def load_intelligence_report(customer_name):
    """Load raw markdown intelligence report."""
    filename = f"{customer_name.replace('/', '-').replace(' ', '_')}.md"
    filepath = f"data/intelligence/reports/{filename}"
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return f.read()
    return None

def generate_executives_tab_html(executives, org_structure):
    """Generate HTML for Key Executives tab."""
    if not executives:
        return """
        <div class="pending-notice">
            <h2>⏳ Executive Intelligence In Progress</h2>
            <p>Detailed executive profiles and organizational insights will be available once intelligence research is complete.</p>
        </div>
        """

    exec_cards = []
    for exec in executives:
        exec_cards.append(f"""
        <div class="exec-card">
            <div class="exec-role">{exec['role']}</div>
            <div class="exec-name">{exec['name']}</div>
            <div class="exec-details">
                <div class="exec-detail"><strong>Background:</strong> {exec['background']}</div>
                <div class="exec-detail"><strong>Tenure:</strong> {exec['tenure']}</div>
            </div>
        </div>
        """)

    org_html = f"""
    <div class="card">
        <h2>Organizational Context</h2>
        {markdown_to_html(org_structure) if org_structure else '<p>No organizational details available.</p>'}
    </div>
    """ if org_structure else ""

    return f"""
    <div class="card">
        <h2>Key Executives & Decision Makers</h2>
        <div class="exec-grid">
            {''.join(exec_cards)}
        </div>
    </div>
    {org_html}
    """

def generate_pain_points_tab_html(pain_points, risks):
    """Generate HTML for Pain Points tab."""
    if not pain_points and not risks:
        return """
        <div class="pending-notice">
            <h2>⏳ Challenge Analysis In Progress</h2>
            <p>Detailed pain point analysis and risk assessment will be available once intelligence research is complete.</p>
        </div>
        """

    pain_html = ""
    if pain_points:
        pain_cards = []
        for pain in pain_points:
            severity_class = 'severity-high' if 'HIGH' in pain['severity'].upper() else 'severity-medium'
            pain_cards.append(f"""
            <div class="pain-card {severity_class}">
                <div class="pain-title">{pain['title']}</div>
                <div class="pain-severity">Severity: {pain['severity']}</div>
                <div class="pain-description">{markdown_to_html(pain['description'])}</div>
            </div>
            """)

        pain_html = f"""
        <div class="card">
            <h2>Key Challenges & Pain Points</h2>
            <div class="pain-grid">
                {''.join(pain_cards)}
            </div>
        </div>
        """

    risk_html = ""
    if risks:
        risk_rows = []
        for risk in risks:
            severity_badge = f'<span class="badge badge-{risk["severity"].lower().replace(" ", "-")}">{risk["severity"]}</span>'
            risk_rows.append(f"""
            <tr>
                <td><strong>{risk['risk']}</strong></td>
                <td>{risk['probability']}</td>
                <td>{risk['impact']}</td>
                <td>{severity_badge}</td>
                <td>{risk['mitigation']}</td>
            </tr>
            """)

        risk_html = f"""
        <div class="card">
            <h2>Risk Assessment Matrix</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Risk</th>
                        <th>Probability</th>
                        <th>Impact</th>
                        <th>Severity</th>
                        <th>Mitigation</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(risk_rows)}
                </tbody>
            </table>
        </div>
        """

    return pain_html + risk_html

def generate_competitive_tab_html(competitive_text):
    """Generate HTML for Competitive tab."""
    if not competitive_text:
        return """
        <div class="pending-notice">
            <h2>⏳ Competitive Analysis In Progress</h2>
            <p>Detailed competitive landscape analysis will be available once intelligence research is complete.</p>
        </div>
        """

    return f"""
    <div class="card">
        <h2>Competitive Landscape</h2>
        {markdown_to_html(competitive_text)}
    </div>
    """

def generate_action_plan_tab_html(actions):
    """Generate HTML for Action Plan tab."""
    if not any(actions.values()):
        return """
        <div class="pending-notice">
            <h2>⏳ Action Plan In Progress</h2>
            <p>Strategic action items will be available once intelligence research is complete.</p>
        </div>
        """

    sections = []

    if actions.get('immediate'):
        action_rows = []
        for action in actions['immediate']:
            action_rows.append(f"""
            <tr>
                <td class="priority-col">#{action['priority']}</td>
                <td><strong>{action['title']}</strong> - {action['detail']}</td>
                <td>{action['owner']}</td>
                <td>{action['metric']}</td>
            </tr>
            """)

        sections.append(f"""
        <div class="card">
            <h2>🔥 Immediate Actions (0-30 Days)</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">Priority</th>
                        <th>Action</th>
                        <th>Owner</th>
                        <th>Success Metric</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(action_rows)}
                </tbody>
            </table>
        </div>
        """)

    if actions.get('short_term'):
        action_rows = []
        for action in actions['short_term']:
            action_rows.append(f"""
            <tr>
                <td class="priority-col">#{action['priority']}</td>
                <td><strong>{action['title']}</strong> - {action['detail']}</td>
                <td>{action['owner']}</td>
                <td>{action['metric']}</td>
            </tr>
            """)

        sections.append(f"""
        <div class="card">
            <h2>📅 Short-Term Actions (30-90 Days)</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">Priority</th>
                        <th>Action</th>
                        <th>Owner</th>
                        <th>Success Metric</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(action_rows)}
                </tbody>
            </table>
        </div>
        """)

    if actions.get('strategic'):
        action_rows = []
        for action in actions['strategic']:
            action_rows.append(f"""
            <tr>
                <td class="priority-col">#{action['priority']}</td>
                <td><strong>{action['title']}</strong> - {action['detail']}</td>
                <td>{action['owner']}</td>
                <td>{action['metric']}</td>
            </tr>
            """)

        sections.append(f"""
        <div class="card">
            <h2>🎯 Strategic Actions (90+ Days)</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 60px;">Priority</th>
                        <th>Action</th>
                        <th>Owner</th>
                        <th>Success Metric</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join(action_rows)}
                </tbody>
            </table>
        </div>
        """)

    return ''.join(sections)

def generate_financial_tab_html(financial):
    """Generate HTML for Financial tab."""
    if not any(financial.values()):
        return """
        <div class="pending-notice">
            <h2>⏳ Financial Analysis In Progress</h2>
            <p>Detailed financial analysis will be available once intelligence research is complete.</p>
        </div>
        """

    sections = []

    if financial.get('recent_performance'):
        sections.append(f"""
        <div class="card">
            <h2>Recent Financial Performance</h2>
            {markdown_to_html(financial['recent_performance'])}
        </div>
        """)

    if financial.get('guidance'):
        sections.append(f"""
        <div class="card">
            <h2>Financial Guidance & Targets</h2>
            {markdown_to_html(financial['guidance'])}
        </div>
        """)

    if financial.get('summary'):
        sections.append(f"""
        <div class="card">
            <h2>Financial Summary</h2>
            {markdown_to_html(financial['summary'])}
        </div>
        """)

    return ''.join(sections)

def generate_org_structure_tab_html(strategic_direction, org_structure):
    """Generate HTML for Org Structure tab."""
    if not strategic_direction and not org_structure:
        return """
        <div class="pending-notice">
            <h2>⏳ Organizational Intelligence In Progress</h2>
            <p>Detailed organizational structure and strategic direction will be available once intelligence research is complete.</p>
        </div>
        """

    sections = []

    if strategic_direction:
        sections.append(f"""
        <div class="card">
            <h2>Strategic Direction</h2>
            {markdown_to_html(strategic_direction)}
        </div>
        """)

    if org_structure:
        sections.append(f"""
        <div class="card">
            <h2>Organizational Structure</h2>
            {markdown_to_html(org_structure)}
        </div>
        """)

    return ''.join(sections)

# Continue with main dashboard generation...
# (This will be a long file - breaking into multiple parts)

print("Premium dashboard generator loaded successfully")
print("Run with: python3 generate_premium_dashboards.py")
