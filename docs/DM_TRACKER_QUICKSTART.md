# DM% Tracker - Quick Start Guide

## 🚀 Getting Started in 60 Seconds

### 1. View the DM% Tracker

#### Option A: Main Dashboard
1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/dashboard`
3. Click the **"Detailed Analysis"** tab
4. Scroll to **"DM% Tracking & Forecasting"** section

#### Option B: Test Page
1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/test-dm-tracker`
3. View the isolated DM% tracker component

### 2. Update the Data

```bash
# Extract latest data from Excel
python3 scripts/extract_dm_data.py

# Verify output (should show JSON)
# Cache will auto-refresh on next page load
```

### 3. Understand the Metrics

**DM% Formula:**
```
DM% = (Current Quarter RR / Prior Quarter RR) × 100
```

**Target:** ≥90% (green) | <90% (red)

**Current Status (Q1'26):**
- ✅ Consolidated: 97.37% (PASSING)
- ✅ Cloudsense: 94.72% (PASSING)
- ✅ Kandy: 97.79% (PASSING)
- ✅ STL: 122.23% (PASSING)

---

## 📊 What You'll See

### 1. Consolidated Alert
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✓ Consolidated DM%: 97.37% (PASSING)  ┃
┃                                        ┃
┃ Revenue retention is above target...   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 2. BU Performance Cards
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Cloudsense   │  │    Kandy     │  │     STL      │
│   94.7%      │  │    97.8%     │  │   122.2%     │
│  PASSING     │  │   PASSING    │  │   PASSING    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3. Detailed Table
All BUs with current RR, prior RR, DM%, variance, and status

### 4. Trend Chart
Line chart showing:
- Historical TTM trends (last 4 quarters)
- Forecasted trends (next 4 quarters)
- 90% target line
- Per-BU comparison

### 5. Forecast Table
Next 4 quarters with confidence levels

---

## 🎯 Key Insights at a Glance

| Question | Answer |
|----------|--------|
| **Are we retaining revenue?** | ✅ Yes - 97.37% consolidated DM% |
| **Which BU needs attention?** | Cloudsense (94.72% - closest to 90%) |
| **Which BU is growing?** | STL (122.23% - 22% over target!) |
| **What's the forecast?** | Stable to improving (99.82% next quarter) |
| **Overall health?** | ✅ PASSING - All BUs above 90% target |

---

## 🔧 Technical Quick Reference

### File Locations
```
scripts/extract_dm_data.py                    # Data extraction
src/lib/data/server/dm-tracker-data.ts        # Server data layer
src/app/dashboard/components/dm-tracker.tsx   # Main component
src/app/dashboard/components/dm-trend-chart.tsx # Chart component
```

### Key Functions
```typescript
// Server-side data fetching
import { getDMTrackerData } from '@/lib/data/server/dm-tracker-data'

// Usage in component
const result = await getDMTrackerData()
if (result.success) {
  const data = result.value
  // data.consolidated.dm_pct
  // data.business_units
  // data.forecast
}
```

### Data Structure
```typescript
interface DMTrackerData {
  business_units: BUDMData[]        // Per-BU metrics
  consolidated: ConsolidatedDMData  // Rollup
  forecast: {
    method: string
    avg_quarterly_decline_rate: number
    quarters: DMForecastQuarter[]
  }
  extracted_at: string
  fiscal_quarter: string
}
```

---

## 🎨 Customization

### Change Target Threshold
```python
# In scripts/extract_dm_data.py
dm_data["consolidated"] = {
  # ...
  "target": 95.0  # Change from 90.0 to 95.0
}
```

### Change Colors
```tsx
// In src/app/dashboard/components/dm-tracker.tsx
const bgGradient = isSuccess
  ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'  // Success
  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'  // Failure
```

### Change Cache TTL
```typescript
// In src/lib/data/server/dm-tracker-data.ts
return cache.get(
  'dm-tracker:data',
  async () => { /* ... */ },
  { ttl: ttl.FINANCIAL }  // Modify this
)
```

---

## 🐛 Troubleshooting

### Issue: "Python 3 not found"
```bash
# Install Python 3
brew install python3  # macOS
apt-get install python3  # Linux
```

### Issue: "openpyxl module not found"
```bash
pip3 install openpyxl
```

### Issue: "Excel file not found"
```bash
# Verify file location
ls -la "2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx"

# Update path in script if needed
# scripts/extract_dm_data.py, line 12
```

### Issue: "Chart not rendering"
```bash
# Verify Chart.js is installed
npm list chart.js

# Reinstall if needed
npm install chart.js
```

### Issue: "TypeScript errors"
```bash
# Check for errors
npx tsc --noEmit

# Focus on DM tracker files
npx tsc --noEmit | grep dm-tracker
```

---

## 📖 Further Reading

- **Full Documentation:** `/docs/DM_TRACKER.md`
- **Deliverable Summary:** `/docs/DM_TRACKER_DELIVERABLE.md`
- **Visual Summary:** `/docs/DM_TRACKER_VISUAL_SUMMARY.md`
- **Test Page:** `/test-dm-tracker`

---

## 💡 Pro Tips

1. **Bookmark the test page** for quick access during development
2. **Watch Cloudsense closely** - it's closest to the 90% threshold
3. **Celebrate STL's success** - 122% indicates strong expansion
4. **Review forecast confidence** - medium confidence for Q2/Q3, low for Q4/Q1
5. **Monitor variance trends** - negative variance indicates revenue decline

---

## 🎓 Understanding the Metrics

### What is DM%?
**DM% (Decline/Maintenance Rate)** measures how much of last period's revenue you retained this period.

- **100% DM%** = Flat revenue (no growth, no decline)
- **>100% DM%** = Growth (expansion within existing customers)
- **90-100% DM%** = Healthy retention (small natural churn)
- **<90% DM%** = Concerning decline (action required)

### Why 90%?
Industry standard for SaaS businesses:
- 10% annual churn is acceptable
- Below 90% suggests systemic issues
- Above 90% indicates healthy business

### Example:
```
Last Quarter RR: $1,000,000
This Quarter RR: $950,000

DM% = ($950,000 / $1,000,000) × 100 = 95%

Status: PASSING ✅ (above 90% threshold)
Variance: -$50,000 (decline, but within acceptable range)
```

---

## 🚦 Status Interpretation

### 🟢 DM% ≥ 100% (Green)
- **Meaning:** Revenue growth
- **Example:** STL at 122.23%
- **Action:** Understand and replicate success

### 🟡 DM% 90-100% (Yellow-Green)
- **Meaning:** Healthy retention with minor decline
- **Example:** Cloudsense at 94.72%, Kandy at 97.79%
- **Action:** Monitor and maintain

### 🔴 DM% < 90% (Red)
- **Meaning:** Significant revenue contraction
- **Example:** None currently (all BUs passing)
- **Action:** Immediate investigation and intervention required

---

## 📞 Support

For questions or issues:
1. Check the full documentation: `/docs/DM_TRACKER.md`
2. Review TypeScript types: `src/lib/data/server/dm-tracker-data.ts`
3. Inspect Python script: `scripts/extract_dm_data.py`
4. Test in isolation: `/test-dm-tracker`

---

## ✅ Success Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Navigate to `/test-dm-tracker`
- [ ] See consolidated DM% (97.37%)
- [ ] See all 3 BU cards (Cloudsense, Kandy, STL)
- [ ] See detailed table with all metrics
- [ ] See trend chart with historical + forecast
- [ ] See forecast table (4 quarters)
- [ ] All BUs showing PASSING status
- [ ] Colors correct (green for passing)

If all checked: **You're ready to go!** 🎉
