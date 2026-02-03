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
echo "  1. Extract customer data for all BUs (Kandy, STL, NewNet)"
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
echo "[STEP 1/6] EXTRACTING CUSTOMER DATA - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

echo "→ Extracting Kandy customers..."
python3 scripts/extract_kandy_customers.py
echo ""

echo "→ Extracting STL customers..."
python3 scripts/extract_stl_customers.py
echo ""

echo "→ Extracting NewNet customers..."
python3 scripts/extract_newnet_customers.py
echo ""

echo "✅ Customer data extraction complete"
echo ""

# =============================================================================
# STEP 2: Add Region Classifications
# =============================================================================
echo "==================================================================="
echo "[STEP 2/6] ADDING REGION CLASSIFICATIONS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

python3 scripts/add_region_to_customers.py
echo ""

echo "✅ Region classification complete"
echo ""

# =============================================================================
# STEP 3: Fetch Customer News (if script exists)
# =============================================================================
echo "==================================================================="
echo "[STEP 3/6] FETCHING CUSTOMER NEWS - $(date '+%H:%M:%S')"
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
echo "[STEP 4/6] REGENERATING ALL DASHBOARDS - $(date '+%H:%M:%S')"
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
echo "[STEP 5/6] REGENERATING INDEX PAGES - $(date '+%H:%M:%S')"
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
# STEP 6: Master Analytics Dashboard
# =============================================================================
echo "==================================================================="
echo "[STEP 6/6] UPDATING MASTER ANALYTICS - $(date '+%H:%M:%S')"
echo "==================================================================="
echo ""

if [ -f "output/analytics.html" ]; then
    echo "✅ Master analytics dashboard exists at output/analytics.html"
else
    echo "⚠️  Master analytics dashboard not found at output/analytics.html"
    echo "   To create it, use the analytics dashboard generation script"
fi
echo ""

# =============================================================================
# COMPLETION
# =============================================================================
echo "==================================================================="
echo "✅ MASTER UPDATE COMPLETE - $(date)"
echo "==================================================================="
echo ""
echo "Updated outputs:"
echo "  • Customer data: data/customers_*_top80.json"
echo "  • Dashboards: output/*.html (all BUs)"
echo "  • Index pages: output/index.html, output/index_*.html"
echo "  • Analytics: output/analytics.html"
echo ""
echo "To view dashboards:"
echo "  open output/index.html          # Master index"
echo "  open output/analytics.html      # Cross-BU analytics"
echo "  open output/index_kandy.html    # Kandy customers"
echo "  open output/index_stl.html      # STL customers"
echo "  open output/index_newnet.html   # NewNet customers"
echo ""
echo "==================================================================="
