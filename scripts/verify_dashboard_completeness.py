#!/usr/bin/env python3
"""
Verify that all dashboard tabs have content.
Checks each intelligence report and identifies missing sections.
"""

import re
from pathlib import Path

def extract_section_from_markdown(md_content, section_name):
    """Extract a specific section from markdown content."""
    if not md_content:
        return None

    # Try exact match first
    pattern = rf'##\s+{re.escape(section_name)}\s*\n(.*?)(?=\n##\s+|\Z)'
    match = re.search(pattern, md_content, re.DOTALL | re.IGNORECASE)

    if match:
        return match.group(1).strip()

    # Try partial match
    pattern = rf'##\s+[^\n]*{re.escape(section_name)}[^\n]*\n(.*?)(?=\n##\s+|\Z)'
    match = re.search(pattern, md_content, re.DOTALL | re.IGNORECASE)

    if match:
        return match.group(1).strip()

    return None

def check_customer_sections(report_path):
    """Check which sections are available in a customer report."""
    with open(report_path, 'r') as f:
        content = f.read()

    # Get all section headers
    all_sections = re.findall(r'^##\s+(.+?)$', content, re.MULTILINE)

    # Check for required sections
    sections = {
        'exec_summary': (
            extract_section_from_markdown(content, 'EXECUTIVE SUMMARY') or
            extract_section_from_markdown(content, 'Executive Summary')
        ),
        'company_intel': (
            extract_section_from_markdown(content, 'COMPANY INTELLIGENCE') or
            extract_section_from_markdown(content, 'Company Intelligence') or
            extract_section_from_markdown(content, 'COMPANY PROFILE') or
            extract_section_from_markdown(content, 'COMPANY OVERVIEW')
        ),
        'executives': (
            extract_section_from_markdown(content, 'EXECUTIVE LEADERSHIP') or
            extract_section_from_markdown(content, 'KEY EXECUTIVES') or
            extract_section_from_markdown(content, 'LEADERSHIP') or
            extract_section_from_markdown(content, 'COMPANY OVERVIEW')
        ),
        'org_structure': (
            extract_section_from_markdown(content, 'ORGANIZATIONAL STRUCTURE') or
            extract_section_from_markdown(content, '2. ORGANIZATIONAL STRUCTURE') or
            extract_section_from_markdown(content, 'ORG STRUCTURE') or
            extract_section_from_markdown(content, 'ORGANIZATION') or
            extract_section_from_markdown(content, 'CORPORATE STRUCTURE') or
            extract_section_from_markdown(content, 'BUSINESS SEGMENTS') or
            extract_section_from_markdown(content, 'KEY STAKEHOLDERS') or
            extract_section_from_markdown(content, 'COMPANY PROFILE') or
            extract_section_from_markdown(content, 'PARENT COMPANY') or
            extract_section_from_markdown(content, 'CORPORATE TRANSFORMATION') or
            extract_section_from_markdown(content, 'COMPANY OVERVIEW') or
            extract_section_from_markdown(content, 'STRATEGIC CONTEXT') or
            extract_section_from_markdown(content, 'STRATEGIC DIRECTION') or
            extract_section_from_markdown(content, 'STRATEGIC INTELLIGENCE') or
            extract_section_from_markdown(content, 'STRATEGIC ANALYSIS') or
            extract_section_from_markdown(content, 'FINANCIAL ANALYSIS')
        ),
        'pain_points': (
            extract_section_from_markdown(content, 'PAIN POINTS & CHALLENGES') or
            extract_section_from_markdown(content, 'PAIN POINTS') or
            extract_section_from_markdown(content, 'CHALLENGES') or
            extract_section_from_markdown(content, 'RISK ASSESSMENT') or
            extract_section_from_markdown(content, 'RISKS')
        ),
        'competitive': (
            extract_section_from_markdown(content, 'COMPETITIVE LANDSCAPE') or
            extract_section_from_markdown(content, '7. COMPETITIVE LANDSCAPE') or
            extract_section_from_markdown(content, 'COMPETITIVE') or
            extract_section_from_markdown(content, 'COMPETITION') or
            extract_section_from_markdown(content, 'COMPETITIVE THREAT') or
            extract_section_from_markdown(content, 'MARKET CONTEXT') or
            extract_section_from_markdown(content, 'STRATEGIC CONTEXT') or
            extract_section_from_markdown(content, 'STRATEGIC ANALYSIS') or
            extract_section_from_markdown(content, 'ROOT CAUSE ANALYSIS')
        ),
        'opportunities': (
            extract_section_from_markdown(content, 'OPPORTUNITY ANALYSIS') or
            extract_section_from_markdown(content, 'OPPORTUNITY ASSESSMENT') or
            extract_section_from_markdown(content, 'OPPORTUNITIES') or
            extract_section_from_markdown(content, '6. EXPANSION OPPORTUNITIES') or
            extract_section_from_markdown(content, 'OPPORTUNIT') or
            extract_section_from_markdown(content, 'GROWTH') or
            extract_section_from_markdown(content, 'EXPANSION') or
            extract_section_from_markdown(content, 'STRATEGIC INTELLIGENCE') or
            extract_section_from_markdown(content, 'STRATEGIC OPTIONS')
        ),
        'action_plan': (
            extract_section_from_markdown(content, 'ACCOUNT STRATEGY RECOMMENDATIONS') or
            extract_section_from_markdown(content, 'RECOMMENDED ACTIONS') or
            extract_section_from_markdown(content, 'RECOMMENDED ACTION PLAN') or
            extract_section_from_markdown(content, 'ACCOUNT STRATEGY') or
            extract_section_from_markdown(content, 'STRATEGY RECOMMENDATIONS') or
            extract_section_from_markdown(content, 'ACTION PLAN') or
            extract_section_from_markdown(content, '8. RELATIONSHIP STRATEGY') or
            extract_section_from_markdown(content, 'RELATIONSHIP STRATEGY') or
            extract_section_from_markdown(content, 'NEXT STEPS') or
            extract_section_from_markdown(content, 'RECOMMENDATIONS')
        )
    }

    # Determine which are missing
    missing = []
    for key, value in sections.items():
        if not value or len(value.strip()) < 50:  # Less than 50 chars is essentially empty
            missing.append(key)

    return {
        'all_sections': all_sections,
        'extracted': {k: bool(v and len(v.strip()) >= 50) for k, v in sections.items()},
        'missing': missing
    }

def main():
    """Check all intelligence reports."""
    reports_dir = Path('data/intelligence/reports')

    print("=" * 100)
    print("DASHBOARD COMPLETENESS VERIFICATION")
    print("=" * 100)
    print()

    all_reports = sorted(reports_dir.glob('*.md'))

    issues_found = {}

    for report_path in all_reports:
        customer_name = report_path.stem.replace('_', ' ')
        result = check_customer_sections(report_path)

        if result['missing']:
            issues_found[customer_name] = result
            print(f"❌ {customer_name}")
            print(f"   Missing: {', '.join(result['missing'])}")
            print(f"   Available sections: {', '.join(result['all_sections'][:5])}...")
            print()
        else:
            print(f"✅ {customer_name} - All sections present")

    print()
    print("=" * 100)
    print(f"SUMMARY: {len(all_reports) - len(issues_found)}/{len(all_reports)} customers complete")
    print(f"Issues found in {len(issues_found)} customers")
    print("=" * 100)

    if issues_found:
        print("\nDETAILED ISSUES:")
        for customer, result in issues_found.items():
            print(f"\n{customer}:")
            print(f"  Available sections in report:")
            for section in result['all_sections']:
                print(f"    - {section}")
            print(f"  Missing tabs: {', '.join(result['missing'])}")

if __name__ == '__main__':
    main()
