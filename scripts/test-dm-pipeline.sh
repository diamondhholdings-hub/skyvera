#!/bin/bash
# Test DM Pipeline (without Claude API)
# Tests data extraction and opportunity analysis

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "================================================"
echo "DM PIPELINE TEST (No API calls)"
echo "================================================"
echo ""

cd "$PROJECT_ROOT"

# Step 1: Extract enhanced data
echo "Step 1: Extracting enhanced DM data..."
python3 scripts/extract-dm-enhanced-data.py > data/dm-enhanced-data.json 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Data extraction successful"
    ACCOUNTS=$(cat data/dm-enhanced-data.json | grep -o '"totalAccounts": [0-9]*' | grep -o '[0-9]*')
    ARR=$(cat data/dm-enhanced-data.json | grep -o '"totalCurrentARR": [0-9.]*' | grep -o '[0-9.]*')
    echo "  - Accounts: $ACCOUNTS"
    echo "  - Total ARR: \$$ARR"
else
    echo "❌ Data extraction failed"
    exit 1
fi
echo ""

# Step 2: Analyze opportunities
echo "Step 2: Analyzing opportunities..."
ts-node scripts/analyze-dm-opportunities.ts > data/dm-opportunities.json 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Opportunity analysis successful"
    OPPS=$(cat data/dm-opportunities.json | grep -o '"opportunitiesFound": [0-9]*' | grep -o '[0-9]*')
    echo "  - Opportunities found: $OPPS"
else
    echo "❌ Opportunity analysis failed"
    exit 1
fi
echo ""

echo "================================================"
echo "TEST COMPLETE"
echo "================================================"
echo ""
echo "Generated files:"
echo "  - data/dm-enhanced-data.json (${ACCOUNTS} accounts)"
echo "  - data/dm-opportunities.json (${OPPS} opportunities)"
echo ""
echo "To generate recommendations with Claude API:"
echo "  export ANTHROPIC_API_KEY=your_key"
echo "  ./scripts/run-dm-pipeline.sh"
echo ""
