#!/usr/bin/env python3
"""Parse intelligence markdown reports and extract content for all dashboard tabs."""

import re
from typing import Dict, List, Optional

def parse_intelligence_report(report_text: str) -> Dict:
    """Parse a complete intelligence report into structured sections."""
    if not report_text:
        return {}

    sections = {
        'executive_summary': extract_executive_summary(report_text),
        'executives': extract_executives(report_text),
        'org_structure': extract_org_structure(report_text),
        'pain_points': extract_pain_points(report_text),
        'competitive': extract_competitive(report_text),
        'action_plan': extract_action_plan(report_text),
        'financial': extract_financial(report_text),
        'strategic_direction': extract_strategic_direction(report_text),
        'opportunities': extract_opportunities(report_text),
        'risks': extract_risks(report_text)
    }

    return sections

def extract_executive_summary(text: str) -> str:
    """Extract executive summary section."""
    pattern = r'## Executive Summary\s*\n(.*?)(?=\n## |\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_executives(text: str) -> List[Dict]:
    """Extract executive leadership information."""
    executives = []

    # Find C-Suite table
    csuite_pattern = r'### C-Suite and Key Decision Makers\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(csuite_pattern, text, re.DOTALL)

    if match:
        table_text = match.group(1)
        # Parse table rows
        rows = re.findall(r'\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+?) \|', table_text)
        for role, name, background, tenure in rows:
            executives.append({
                'role': role.strip(),
                'name': name.strip(),
                'background': background.strip(),
                'tenure': tenure.strip()
            })

    return executives

def extract_org_structure(text: str) -> str:
    """Extract organizational structure information."""
    sections = []

    # Key Stakeholders
    stakeholder_pattern = r'### Key Stakeholders for.*?\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(stakeholder_pattern, text, re.DOTALL)
    if match:
        sections.append(match.group(1).strip())

    # Organizational Changes
    org_changes_pattern = r'### Organizational Changes to Monitor\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(org_changes_pattern, text, re.DOTALL)
    if match:
        sections.append("\n\n### Organizational Changes to Monitor\n\n" + match.group(1).strip())

    return "\n\n".join(sections)

def extract_pain_points(text: str) -> List[Dict]:
    """Extract pain points and challenges."""
    pain_points = []

    # Look for challenges, risks, pain points
    risk_pattern = r'### Detailed Risk Analysis\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(risk_pattern, text, re.DOTALL)

    if match:
        risk_text = match.group(1)
        # Extract each risk
        risks = re.findall(r'\*\*Risk \d+: (.+?)\*\* \(Severity: (.+?)\)\s*\n(.+?)(?=\n\*\*Risk|\Z)', risk_text, re.DOTALL)
        for title, severity, description in risks:
            pain_points.append({
                'title': title.strip(),
                'severity': severity.strip(),
                'description': description.strip()
            })

    return pain_points

def extract_competitive(text: str) -> str:
    """Extract competitive analysis."""
    sections = []

    # Competitive Quick Reference
    comp_pattern = r'### C\. Competitive Quick Reference\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(comp_pattern, text, re.DOTALL)
    if match:
        sections.append(match.group(1).strip())

    # Market Position
    market_pattern = r'### Market Position\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(market_pattern, text, re.DOTALL)
    if match:
        sections.append("\n\n### Market Position\n\n" + match.group(1).strip())

    return "\n\n".join(sections)

def extract_action_plan(text: str) -> Dict:
    """Extract action plan with immediate, short-term, and strategic actions."""
    actions = {
        'immediate': [],
        'short_term': [],
        'strategic': []
    }

    # Immediate Actions (0-30 days)
    immediate_pattern = r'### Immediate Actions \(0-30 Days\)\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(immediate_pattern, text, re.DOTALL)
    if match:
        table_text = match.group(1)
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|', table_text)
        for priority, title, detail, owner, metric in rows:
            actions['immediate'].append({
                'priority': int(priority),
                'title': title.strip(),
                'detail': detail.strip(),
                'owner': owner.strip(),
                'metric': metric.strip()
            })

    # Short-Term Actions (30-90 days)
    shortterm_pattern = r'### Short-Term Actions \(30-90 Days\)\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(shortterm_pattern, text, re.DOTALL)
    if match:
        table_text = match.group(1)
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|', table_text)
        for priority, title, detail, owner, metric in rows:
            actions['short_term'].append({
                'priority': int(priority),
                'title': title.strip(),
                'detail': detail.strip(),
                'owner': owner.strip(),
                'metric': metric.strip()
            })

    # Strategic Actions (90+ days)
    strategic_pattern = r'### Strategic Actions \(90\+ Days\)\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(strategic_pattern, text, re.DOTALL)
    if match:
        table_text = match.group(1)
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|', table_text)
        for priority, title, detail, owner, metric in rows:
            actions['strategic'].append({
                'priority': int(priority),
                'title': title.strip(),
                'detail': detail.strip(),
                'owner': owner.strip(),
                'metric': metric.strip()
            })

    return actions

def extract_financial(text: str) -> Dict:
    """Extract financial analysis and data."""
    financial = {
        'recent_performance': '',
        'guidance': '',
        'summary': ''
    }

    # Recent Financial Performance
    perf_pattern = r'### Recent Financial Performance\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(perf_pattern, text, re.DOTALL)
    if match:
        financial['recent_performance'] = match.group(1).strip()

    # Financial Guidance
    guidance_pattern = r'### .*?Guidance\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(guidance_pattern, text, re.DOTALL)
    if match:
        financial['guidance'] = match.group(1).strip()

    # Financial Summary (from appendix)
    summary_pattern = r'### B\. Financial Summary\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(summary_pattern, text, re.DOTALL)
    if match:
        financial['summary'] = match.group(1).strip()

    return financial

def extract_strategic_direction(text: str) -> str:
    """Extract strategic direction and priorities."""
    pattern = r'## Strategic Direction\s*\n\n(.*?)(?=\n## |\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_opportunities(text: str) -> List[Dict]:
    """Extract strategic opportunities."""
    opportunities = []

    opp_pattern = r'### Strategic Opportunities\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(opp_pattern, text, re.DOTALL)

    if match:
        opp_text = match.group(1)
        # Extract opportunities
        opps = re.findall(r'\*\*Opportunity \d+: (.+?)\*\*\s*\n(.+?)(?=\n\*\*Opportunity|\n###|\Z)', opp_text, re.DOTALL)
        for title, description in opps:
            opportunities.append({
                'title': title.strip(),
                'description': description.strip()
            })

    return opportunities

def extract_risks(text: str) -> List[Dict]:
    """Extract risk assessment."""
    risks = []

    # Risk Assessment Matrix
    risk_pattern = r'### Risk Assessment Matrix\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(risk_pattern, text, re.DOTALL)

    if match:
        table_text = match.group(1)
        rows = re.findall(r'\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|', table_text)
        for risk, probability, impact, severity, mitigation in rows:
            risks.append({
                'risk': risk.strip(),
                'probability': probability.strip(),
                'impact': impact.strip(),
                'severity': severity.strip(),
                'mitigation': mitigation.strip()
            })

    return risks

def markdown_to_html(md_text: str) -> str:
    """Convert simple markdown to HTML."""
    if not md_text:
        return ""

    html = md_text

    # Headers
    html = re.sub(r'### (.+?)\n', r'<h3>\1</h3>\n', html)
    html = re.sub(r'## (.+?)\n', r'<h2>\1</h2>\n', html)

    # Bold
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)

    # Lists
    html = re.sub(r'^\d+\. (.+?)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^- (.+?)$', r'<li>\1</li>', html, flags=re.MULTILINE)

    # Wrap consecutive <li> in <ul>
    html = re.sub(r'(<li>.*?</li>(?:\n<li>.*?</li>)*)', r'<ul>\1</ul>', html, flags=re.DOTALL)

    # Tables - convert markdown tables to HTML
    # This is a simplified version
    lines = html.split('\n')
    in_table = False
    table_html = []
    for line in lines:
        if '|' in line and not line.strip().startswith('|---'):
            if not in_table:
                table_html.append('<table class="data-table">')
                in_table = True
            cells = [c.strip() for c in line.split('|')[1:-1]]
            row_html = '<tr>' + ''.join([f'<td>{c}</td>' for c in cells]) + '</tr>'
            table_html.append(row_html)
        elif in_table and '|' not in line:
            table_html.append('</table>')
            in_table = False
            table_html.append(line)
        elif not in_table:
            table_html.append(line)

    if in_table:
        table_html.append('</table>')

    html = '\n'.join(table_html)

    # Paragraphs
    html = re.sub(r'\n\n', '</p><p>', html)
    html = '<p>' + html + '</p>'

    # Clean up
    html = html.replace('<p></p>', '')
    html = html.replace('<p><h2>', '<h2>').replace('</h2></p>', '</h2>')
    html = html.replace('<p><h3>', '<h3>').replace('</h3></p>', '</h3>')
    html = html.replace('<p><ul>', '<ul>').replace('</ul></p>', '</ul>')
    html = html.replace('<p><table', '<table').replace('</table></p>', '</table>')

    return html

if __name__ == '__main__':
    # Test with Telstra report
    with open('data/intelligence/reports/Telstra_Corporation_Limited.md', 'r') as f:
        report_text = f.read()

    sections = parse_intelligence_report(report_text)

    print("Extracted sections:")
    for key, value in sections.items():
        if isinstance(value, list):
            print(f"{key}: {len(value)} items")
        elif isinstance(value, dict):
            print(f"{key}: {sum(len(v) if isinstance(v, list) else 1 for v in value.values())} items")
        else:
            print(f"{key}: {len(value)} chars")
