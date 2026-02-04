#!/usr/bin/env python3
"""Generate premium account plan dashboards with rich content in all 7 tabs.

This generator creates top-tier account plans by:
1. Parsing intelligence markdown reports
2. Extracting structured data for each tab
3. Generating rich, formatted HTML for all sections
4. Creating a professional, engaging user experience
"""

import json
import os
import re
import sys
from datetime import datetime
from typing import Dict, List

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

def load_intelligence_html():
    """Load pregenerated intelligence HTML (for Overview tab)."""
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

def get_customer_intelligence_html(customer_name, intelligence_data):
    """Get pregenerated intelligence HTML for Overview tab."""
    customer_key = customer_name.replace('/', '-').replace(' ', '_')
    if customer_key in intelligence_data:
        return intelligence_data[customer_key]
    
    customer_key_no_underscore = customer_name.replace('/', ' ').replace('  ', ' ')
    for key in intelligence_data.keys():
        if key.replace('_', ' ').lower() == customer_key_no_underscore.lower():
            return intelligence_data[key]
    
    return None

# Intelligence parsing functions
def parse_intelligence_report(report_text):
    """Parse intelligence report into structured sections."""
    if not report_text:
        return None
    
    return {
        'executives': extract_executives(report_text),
        'org_structure': extract_org_structure(report_text),
        'pain_points': extract_pain_points(report_text),
        'competitive': extract_competitive(report_text),
        'action_plan': extract_action_plan(report_text),
        'financial': extract_financial(report_text),
        'strategic_direction': extract_strategic_direction(report_text),
        'risks': extract_risks(report_text),
        'action_items_short': extract_action_items_short(report_text),
        'critical_alerts': extract_critical_alerts(report_text)
    }

def extract_executives(text):
    """Extract executive leadership information."""
    executives = []
    csuite_pattern = r'### C-Suite and Key Decision Makers\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(csuite_pattern, text, re.DOTALL)
    
    if match:
        table_text = match.group(1)
        rows = re.findall(r'\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+?) \|', table_text)
        for role, name, background, tenure in rows:
            executives.append({
                'role': role.strip(),
                'name': name.strip(),
                'background': background.strip(),
                'tenure': tenure.strip()
            })
    
    return executives

def extract_org_structure(text):
    """Extract organizational structure information."""
    sections = []
    
    stakeholder_pattern = r'### Key Stakeholders for.*?\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(stakeholder_pattern, text, re.DOTALL)
    if match:
        sections.append(match.group(1).strip())
    
    org_changes_pattern = r'### Organizational Changes to Monitor\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(org_changes_pattern, text, re.DOTALL)
    if match:
        sections.append("\n\n**Organizational Changes to Monitor:**\n\n" + match.group(1).strip())
    
    return "\n\n".join(sections) if sections else ""

def extract_pain_points(text):
    """Extract pain points and challenges."""
    pain_points = []
    risk_pattern = r'### Detailed Risk Analysis\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(risk_pattern, text, re.DOTALL)
    
    if match:
        risk_text = match.group(1)
        risks = re.findall(r'\*\*Risk \d+: (.+?)\*\* \(Severity: (.+?)\)\s*\n(.+?)(?=\n\*\*Risk|\Z)', risk_text, re.DOTALL)
        for title, severity, description in risks:
            pain_points.append({
                'title': title.strip(),
                'severity': severity.strip(),
                'description': description.strip()[:300]
            })
    
    return pain_points

def extract_competitive(text):
    """Extract competitive analysis."""
    sections = []
    
    comp_pattern = r'### C\. Competitive Quick Reference\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(comp_pattern, text, re.DOTALL)
    if match:
        sections.append(match.group(1).strip())
    
    market_pattern = r'### Market Position\s*\n\n(.*?)(?=\n### |\n## |\Z)'
    match = re.search(market_pattern, text, re.DOTALL)
    if match:
        sections.append("\n\n**Market Position:**\n\n" + match.group(1).strip())
    
    return "\n\n".join(sections) if sections else ""

def extract_action_plan(text):
    """Extract action plan with immediate, short-term, and strategic actions."""
    actions = {'immediate': [], 'short_term': [], 'strategic': []}
    
    # Immediate Actions
    immediate_pattern = r'### Immediate Actions \(0-30 Days\)\s*\n\n.*?\n\n(.*?)(?=\n### |\Z)'
    match = re.search(immediate_pattern, text, re.DOTALL)
    if match:
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|', match.group(1))
        for priority, title, detail, owner, metric in rows:
            actions['immediate'].append({
                'priority': int(priority),
                'title': title.strip(),
                'detail': detail.strip(),
                'owner': owner.strip(),
                'metric': metric.strip()
            })
    
    # Short-Term Actions
    shortterm_pattern = r'### Short-Term Actions \(30-90 Days\)\s*\n\n.*?\n\n(.*?)(?=\n### |\Z)'
    match = re.search(shortterm_pattern, text, re.DOTALL)
    if match:
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|', match.group(1))
        for priority, title, detail, owner, metric in rows:
            actions['short_term'].append({
                'priority': int(priority),
                'title': title.strip(),
                'detail': detail.strip(),
                'owner': owner.strip(),
                'metric': metric.strip()
            })
    
    # Strategic Actions
    strategic_pattern = r'### Strategic Actions \(90\+ Days\)\s*\n\n.*?\n\n(.*?)(?=\n### |\Z)'
    match = re.search(strategic_pattern, text, re.DOTALL)
    if match:
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\* - (.+?) \| (.+?) \| (.+?) \|', match.group(1))
        for priority, title, detail, owner, metric in rows:
            actions['strategic'].append({
                'priority': int(priority),
                'title': title.strip(),
                'detail': detail.strip(),
                'owner': owner.strip(),
                'metric': metric.strip()
            })
    
    return actions

def extract_financial(text):
    """Extract financial analysis."""
    financial = {'recent_performance': '', 'guidance': '', 'summary': ''}
    
    # Recent Financial Performance
    perf_pattern = r'### Recent Financial Performance\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(perf_pattern, text, re.DOTALL)
    if match:
        financial['recent_performance'] = match.group(1).strip()[:1000]
    
    # Financial Guidance
    guidance_pattern = r'###.*?Guidance\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(guidance_pattern, text, re.DOTALL)
    if match:
        financial['guidance'] = match.group(1).strip()[:1000]
    
    # Enterprise Division Performance
    enterprise_pattern = r'### Enterprise Division Performance.*?\n\n(.*?)(?=\n### |\Z)'
    match = re.search(enterprise_pattern, text, re.DOTALL)
    if match:
        financial['summary'] = match.group(1).strip()[:1000]
    
    return financial

def extract_strategic_direction(text):
    """Extract strategic direction."""
    pattern = r'### Connected Future 30 Strategic Pillars\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()[:1500]
    
    pattern = r'### Evolution of Corporate Strategy\s*\n\n(.*?)(?=\n### |\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()[:1500]
    
    return ""

def extract_risks(text):
    """Extract risk assessment."""
    risks = []
    risk_pattern = r'### Risk Assessment Matrix\s*\n\n.*?\n\n(.*?)(?=\n### |\Z)'
    match = re.search(risk_pattern, text, re.DOTALL)
    
    if match:
        rows = re.findall(r'\| \*\*(.+?)\*\* \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|', match.group(1))
        for risk, probability, impact, severity, mitigation in rows:
            risks.append({
                'risk': risk.strip(),
                'probability': probability.strip(),
                'impact': impact.strip(),
                'severity': severity.strip(),
                'mitigation': mitigation.strip()[:100]
            })
    
    return risks

def extract_action_items_short(text):
    """Extract top 3 action items for Keys to Success."""
    actions = []
    immediate_pattern = r'### Immediate Actions.*?\n\n.*?\n\n(.*?)(?=\n### |\Z)'
    match = re.search(immediate_pattern, text, re.DOTALL)
    if match:
        rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\*.*?\|', match.group(1))
        for priority, action in rows[:3]:
            clean_action = action.strip().replace('**', '')
            actions.append({'priority': int(priority), 'action': clean_action})
    
    if len(actions) < 3:
        shortterm_pattern = r'### Short-Term Actions.*?\n\n.*?\n\n(.*?)(?=\n### |\Z)'
        match = re.search(shortterm_pattern, text, re.DOTALL)
        if match:
            rows = re.findall(r'\| (\d+) \| \*\*(.+?)\*\*.*?\|', match.group(1))
            for priority, action in rows[:3-len(actions)]:
                clean_action = action.strip().replace('**', '')
                actions.append({'priority': int(priority), 'action': clean_action})
    
    return actions[:3]

def extract_critical_alerts(text):
    """Extract critical alerts."""
    alerts = []
    findings = re.findall(r'\d+\.\s+\*\*(CAUTION|CRITICAL|RISK):\*\*\s+(.+?)(?=\n\d+\.|\n\n|\Z)', text, re.DOTALL)
    for severity, alert_text in findings[:2]:
        alerts.append({'severity': severity, 'text': alert_text.strip()})
    
    return alerts

# Continue in next message due to length...
