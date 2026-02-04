#!/usr/bin/env python3
"""Add intelligence integration to Kandy, STL, and NewNet dashboard generators."""

import re

# Read the working CloudSense generator to extract the intelligence functions
with open('scripts/generate_dashboards.py', 'r') as f:
    cloudsense_content = f.read()

# Extract intelligence loading functions
intel_functions = re.search(
    r'(def load_intelligence_data\(\):.*?return None)',
    cloudsense_content,
    re.DOTALL
).group(1)

# Files to update
generators = [
    'scripts/generate_dashboards_kandy.py',
    'scripts/generate_dashboards_stl.py',
    'scripts/generate_dashboards_newnet.py'
]

for gen_file in generators:
    print(f"Updating {gen_file}...")
    
    with open(gen_file, 'r') as f:
        content = f.read()
    
    # 1. Add intelligence functions after load_customer_news if not already there
    if 'load_intelligence_data' not in content:
        content = content.replace(
            'def generate_news_widget',
            intel_functions + '\n\ndef generate_news_widget'
        )
    
    # 2. Update create_simple_dashboard signature
    content = re.sub(
        r'def create_simple_dashboard\(customer, all_customers\):',
        'def create_simple_dashboard(customer, all_customers, intelligence_data=None):',
        content
    )
    
    # 3. Add intelligence loading in create_simple_dashboard
    if 'intelligence_html = get_customer_intelligence' not in content:
        content = re.sub(
            r'(news_widget = generate_news_widget\(customer_name, news_data\))',
            r'\1\n\n    # Load intelligence HTML if available\n    if intelligence_data is None:\n        intelligence_data = {}\n    intelligence_html = get_customer_intelligence(customer_name, intelligence_data)',
            content
        )
    
    # 4. Update intelligence placeholder section
    old_placeholder = '''    <div class="container">
        <div class="pending-notice">
            <h2 style="margin-bottom: 1rem;">⏳ Account Intelligence In Progress</h2>
            <p>Comprehensive account plan intelligence (executives, pain points, competitive analysis, opportunities) will be populated here once customer research is complete.</p>
            <p style="margin-top: 1rem;"><strong>Status:</strong> Awaiting customer-intelligence-analyst research for {customer_name}</p>
        </div>

        <div class="card">'''
    
    new_placeholder = '''    <div class="container">
        {f\'\'\'
        <!-- Customer Intelligence Section -->
        {intelligence_html}
        \'\'\' if intelligence_html else f\'\'\'
        <div class="pending-notice">
            <h2 style="margin-bottom: 1rem;">⏳ Account Intelligence In Progress</h2>
            <p>Comprehensive account plan intelligence (executives, pain points, competitive analysis, opportunities) will be populated here once customer research is complete.</p>
            <p style="margin-top: 1rem;"><strong>Status:</strong> Awaiting customer-intelligence-analyst research for {customer_name}</p>
        </div>
        \'\'\'}

        <div class="card">'''
    
    content = content.replace(old_placeholder, new_placeholder)
    
    # 5. Update main() to load intelligence
    if 'intelligence_data = load_intelligence_data()' not in content:
        content = re.sub(
            r"(data = load_customers\(\)\s+customers = data\['customers'\])",
            r"\1\n\n    # Load intelligence data once\n    intelligence_data = load_intelligence_data()\n    print(f\"Loaded intelligence for {len(intelligence_data)} customers\")",
            content
        )
    
    # 6. Pass intelligence_data to create_simple_dashboard
    content = re.sub(
        r'create_simple_dashboard\(customer, customers\)',
        'create_simple_dashboard(customer, customers, intelligence_data)',
        content
    )
    
    # 7. Add intelligence indicator to print statement
    content = re.sub(
        r'print\(f"#\{customer\[.rank.\]:<3\} \{customer_name\[:.*?\]\} → \{filename\}"\)',
        'has_intel = \'📊\' if get_customer_intelligence(customer_name, intelligence_data) else \'  \'\n        print(f"#{customer[\'rank\']:<3} {has_intel} {customer_name[:50]:<50} → {filename}")',
        content
    )
    
    # Write updated content
    with open(gen_file, 'w') as f:
        f.write(content)
    
    print(f"  ✅ Updated {gen_file}")

print("\nDone!")
