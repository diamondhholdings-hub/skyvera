#!/bin/bash
# DM Recommendations Pipeline
# Runs the complete pipeline to generate and seed DM recommendations

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "================================================"
echo "DM RECOMMENDATIONS PIPELINE"
echo "================================================"
echo ""

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY environment variable not set"
    echo "   Please set it with: export ANTHROPIC_API_KEY=your_key_here"
    exit 1
fi

echo "✓ Environment check passed"
echo ""

# Step 1: Extract enhanced DM data from Excel
echo "================================================"
echo "STEP 1: Extracting Enhanced DM Data from Excel"
echo "================================================"
echo ""

cd "$PROJECT_ROOT"
python3 scripts/extract-dm-enhanced-data.py > /dev/null

if [ $? -eq 0 ]; then
    echo "✓ Data extraction complete"
else
    echo "❌ Data extraction failed"
    exit 1
fi
echo ""

# Step 2: Analyze opportunities
echo "================================================"
echo "STEP 2: Analyzing DM Opportunities"
echo "================================================"
echo ""

ts-node scripts/analyze-dm-opportunities.ts > /dev/null

if [ $? -eq 0 ]; then
    echo "✓ Opportunity analysis complete"
else
    echo "❌ Opportunity analysis failed"
    exit 1
fi
echo ""

# Step 3: Generate recommendations using Claude
echo "================================================"
echo "STEP 3: Generating AI-Powered Recommendations"
echo "================================================"
echo ""
echo "⚠️  This will take several minutes due to API rate limiting"
echo "   Progress will be shown and saved incrementally..."
echo ""

# Allow user to limit recommendations for testing
if [ "$1" = "--limit" ] && [ -n "$2" ]; then
    echo "Running with limit: $2 recommendations"
    ts-node scripts/generate-recommendations.ts --limit=$2 > /dev/null
else
    echo "Running full generation (all opportunities)"
    ts-node scripts/generate-recommendations.ts > /dev/null
fi

if [ $? -eq 0 ]; then
    echo "✓ Recommendation generation complete"
else
    echo "❌ Recommendation generation failed"
    exit 1
fi
echo ""

# Step 4: Seed database
echo "================================================"
echo "STEP 4: Seeding Database"
echo "================================================"
echo ""

ts-node scripts/seed-dm-recommendations.ts

if [ $? -eq 0 ]; then
    echo "✓ Database seeding complete"
else
    echo "❌ Database seeding failed"
    exit 1
fi
echo ""

# Summary
echo "================================================"
echo "PIPELINE COMPLETE"
echo "================================================"
echo ""
echo "Generated files:"
echo "  - data/dm-enhanced-data.json"
echo "  - data/dm-opportunities.json"
echo "  - data/dm-recommendations.json"
echo "  - data/dm-summary.txt"
echo ""
echo "View summary:"
echo "  cat data/dm-summary.txt"
echo ""
echo "Database updated with recommendations"
echo ""
