#!/bin/bash
# Master automation script to update all Skyvera BU dashboards and analytics
# Updates customer data, regions, news, dashboards, and index pages for all business units

set -e

REPO_DIR="/Users/RAZER/Documents/projects/Skyvera"
cd "$REPO_DIR"

echo "==================================================================="
echo "SKYVERA MASTER DASHBOARD UPDATE - $(date)"
echo "==================================================================="
echo ""
echo "This script will:"
echo "  1. Extract customer data for all BUs (top 80% for dashboards, 100% for analytics)"
echo "  2. Add region classifications"
echo "  3. Fetch latest news for all customers"
echo "  4. Regenerate all BU-specific dashboards"
echo "  5. Regenerate all index pages"
echo "  6. Update master analytics dashboard"
echo ""

# =============================================================================
# STEP 1: Extract Customer Data
# =============================================================================
echo "==================================================================="
echo "[STEP 1/7] EXTRACTING CUSTOMER DATA - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

echo "→ Extracting top 80% customers for dashboards..."
python3 scripts/extract_kandy_customers.py
python3 scripts/extract_stl_customers.py
python3 scripts/extract_newnet_customers.py
echo ""

echo "→ Extracting ALL customers (100%) for analytics..."
python3 scripts/extract_all_customers.py
echo ""

echo "✅ Customer data extraction complete"
echo ""

# =============================================================================
# STEP 2: Add Region Classifications
# =============================================================================
echo "==================================================================="
echo "[STEP 2/7] ADDING REGION CLASSIFICATIONS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

echo "→ Adding regions to top 80% customer files..."
python3 scripts/add_region_to_customers.py
echo ""

echo "→ Adding regions to all-customer files..."
python3 << 'EOF'
import json
from pathlib import Path
exec(open('scripts/add_region_to_customers.py').read())

files = [
    'data/customers_cloudsense_all.json',
    'data/customers_kandy_all.json',
    'data/customers_stl_all.json',
    'data/customers_newnet_all.json'
]

for filepath in files:
    with open(filepath, 'r') as f:
        data = json.load(f)

    for customer in data['customers']:
        customer['region'] = classify_region(customer['customer_name'])

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"  ✅ {filepath}")

print("\n✅ Region classification complete for all customer files")
EOF
echo ""

# =============================================================================
# STEP 3: Fetch Customer News (if script exists)
# =============================================================================
echo "==================================================================="
echo "[STEP 3/7] FETCHING CUSTOMER NEWS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

if [ -f "scripts/fetch_customer_news.py" ]; then
    echo "→ Fetching news for all BU customers..."
    python3 scripts/fetch_customer_news.py
    echo ""
    echo "✅ News fetch complete"
else
    echo "⚠️  fetch_customer_news.py not found - skipping news update"
fi
echo ""

# =============================================================================
# STEP 4: Regenerate All BU Dashboards
# =============================================================================
echo "==================================================================="
echo "[STEP 4/7] REGENERATING ALL DASHBOARDS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

echo "→ Generating CloudSense dashboards..."
python3 scripts/generate_dashboards.py
echo ""

echo "→ Generating Kandy dashboards..."
python3 scripts/generate_dashboards_kandy.py
echo ""

echo "→ Generating STL dashboards..."
python3 scripts/generate_dashboards_stl.py
echo ""

echo "→ Generating NewNet dashboards..."
python3 scripts/generate_dashboards_newnet.py
echo ""

echo "✅ All dashboards regenerated"
echo ""

# =============================================================================
# STEP 5: Regenerate All Index Pages
# =============================================================================
echo "==================================================================="
echo "[STEP 5/7] REGENERATING INDEX PAGES - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

echo "→ Generating CloudSense index..."
python3 scripts/generate_index.py
echo ""

echo "→ Generating Kandy index..."
python3 scripts/generate_index_kandy.py
echo ""

echo "→ Generating STL index..."
python3 scripts/generate_index_stl.py
echo ""

echo "→ Generating NewNet index..."
python3 scripts/generate_index_newnet.py
echo ""

echo "✅ All index pages regenerated"
echo ""

# =============================================================================
# STEP 6: Regenerate Master Analytics Dashboard
# =============================================================================
echo "==================================================================="
echo "[STEP 6/7] REGENERATING MASTER ANALYTICS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

echo "→ Generating analytics dashboard with ALL customers..."
python3 scripts/generate_analytics_dashboard.py
echo ""

echo "✅ Master analytics dashboard regenerated"
echo ""

# =============================================================================
# STEP 7: Verification
# =============================================================================
echo "==================================================================="
echo "[STEP 7/7] VERIFYING OUTPUTS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

# Count files
CLOUDSENSE_DASHBOARDS=$(ls output/*.html 2>/dev/null | wc -l | xargs)
KANDY_DASHBOARDS=$(ls output/kandy/*.html 2>/dev/null | wc -l | xargs)
STL_DASHBOARDS=$(ls output/stl/*.html 2>/dev/null | wc -l | xargs)
NEWNET_DASHBOARDS=$(ls output/newnet/*.html 2>/dev/null | wc -l | xargs)

echo "Dashboard files created:"
echo "  • CloudSense: $CLOUDSENSE_DASHBOARDS files"
echo "  • Kandy: $KANDY_DASHBOARDS files"
echo "  • STL: $STL_DASHBOARDS files"
echo "  • NewNet: $NEWNET_DASHBOARDS files"
echo ""

echo "✅ Verification complete"
echo ""

# =============================================================================
# COMPLETION
# =============================================================================
echo "==================================================================="
echo "✅ MASTER UPDATE COMPLETE - $(date)"
echo "==================================================================="
echo ""
echo "Updated outputs:"
echo "  • Top 80% data: data/customers_*_top80.json"
echo "  • All customers: data/customers_*_all.json"
echo "  • Dashboards: output/*.html (top 80% customers only)"
echo "  • Index pages: output/*/index.html"
echo "  • Analytics: output/analytics.html (ALL 140 customers)"
echo ""
echo "To view dashboards:"
echo "  open output/index.html          # Master index"
echo "  open output/analytics.html      # Cross-BU analytics"
echo "  open output/index_kandy.html    # Kandy customers"
echo "  open output/index_stl.html      # STL customers"
echo "  open output/index_newnet.html   # NewNet customers"
echo ""
echo "==================================================================="
