#!/bin/bash
# Daily news update automation script

set -e

REPO_DIR="/Users/RAZER/Documents/projects/Skyvera"
cd "$REPO_DIR"

echo "==================================================================="
echo "DAILY CUSTOMER NEWS UPDATE - $(date)"
echo "==================================================================="

# Fetch latest news
echo "1. Fetching customer news from OSINT sources..."
python3 scripts/fetch_customer_news.py

# Regenerate dashboards with new news data
echo ""
echo "2. Regenerating HTML dashboards with news..."
python3 scripts/generate_dashboards.py

# Regenerate index
echo ""
echo "3. Updating index page..."
python3 scripts/generate_index.py

echo ""
echo "==================================================================="
echo "✅ Daily news update complete: $(date)"
echo "==================================================================="

# Optional: Commit changes
# git add data/news/ output/
# git commit -m "chore: daily news update $(date +%Y-%m-%d)"
