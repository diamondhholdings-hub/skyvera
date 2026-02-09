# Testing Patterns

**Analysis Date:** 2026-02-08

## Test Framework Status

**Runner:** Not detected

**Assertion Library:** Not detected

**Test Files:** No test files found in codebase
- Glob search for `*test*`, `*spec*` patterns returned no results
- No `tests/`, `test/`, `__tests__/` directory exists
- No pytest, unittest, or similar configuration files

**Coverage Tools:** Not configured

## Testing Approach

**Current Pattern:** Manual verification scripts and print-based validation

The codebase uses a different testing philosophy: scripts include inline validation through structured print output and data verification rather than automated test suites.

### Validation Scripts

**`verify_dashboard_completeness.py`** (`/Users/RAZER/Documents/projects/Skyvera/scripts/verify_dashboard_completeness.py`)

This script validates that all customer intelligence reports have required sections:

```python
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
            extract_section_from_markdown(content, 'Company Intelligence')
        ),
        # ... more sections
    }

    missing = []
    for key, value in sections.items():
        if not value or len(value.strip()) < 50:
            missing.append(key)

    return {
        'all_sections': all_sections,
        'extracted': {k: bool(v and len(v.strip()) >= 50) for k, v in sections.items()},
        'missing': missing
    }
```

**Running validation:**
```bash
python3 scripts/verify_dashboard_completeness.py
```

**Output format:**
```
❌ Customer_Name
   Missing: exec_summary, company_intel
   Available sections: Section1, Section2...

✅ Another_Customer - All sections present

SUMMARY: 45/50 customers complete
Issues found in 5 customers
```

## Manual Testing Patterns

### Data Extraction Scripts

Scripts extract and transform data with inline validation:

**Example from `comprehensive_customer_analysis.py`:**

```python
# Validation during parsing
try:
    customer_data = {
        'customer': customer_name,
        'ttm_total': float(row[5]) if len(row) > 5 and row[5] is not None else 0.0,
        # ... more fields with type coercion
    }

    # Only add if there's meaningful data
    if customer_data['ttm_total'] > 0 or customer_data['fy26_total'] > 0:
        customers.append(customer_data)
except (ValueError, TypeError) as e:
    # Skip rows with data issues
    continue
```

**Running extraction:**
```bash
python3 comprehensive_customer_analysis.py
```

**Validation output:**
```
==================================================
PARSING RR INPUT (Recurring Revenue)
==================================================

[Output with validation messages]

Total customers parsed:
  RR customers: 85
  NRR customers: 42
  Total: 127
```

### Integration Verification

**`update_all_dashboards.sh`** includes verification step that counts generated files:

```bash
# Verification step
CLOUDSENSE_DASHBOARDS=$(ls output/*.html 2>/dev/null | wc -l | xargs)
KANDY_DASHBOARDS=$(ls output/kandy/*.html 2>/dev/null | wc -l | xargs)

echo "Dashboard files created:"
echo "  • CloudSense: $CLOUDSENSE_DASHBOARDS files"
echo "  • Kandy: $KANDY_DASHBOARDS files"
```

## Data Validation Patterns

### Row-Level Validation

**In Excel parsing (`extract_all_customers.py`):**

```python
for row in ws.iter_rows(min_row=11, values_only=True):
    company = row[0]
    customer_name = row[1]

    # Skip invalid rows
    if company != company_filter or not customer_name:
        continue

    # Type coercion with fallback
    arr = row[6]
    # ... later: arr if arr else 0
```

### Deduplication Testing

**In `fetch_customer_news.py`:**

```python
# Deduplicate by URL
seen_urls = set()
unique_articles = []
for article in all_articles:
    if article['url'] not in seen_urls:
        seen_urls.add(article['url'])
        unique_articles.append(article)

# Filter low relevance
filtered = [a for a in unique_articles if a['relevance_score'] >= 0.3]
return filtered[:8]  # Top 8 articles
```

**Implicit test:** If duplicates exist, they're removed; final count is <= 8

### Regex Pattern Testing

**In `verify_dashboard_completeness.py`:**

```python
def extract_section_from_markdown(md_content, section_name):
    """Extract a specific section from markdown content."""
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
```

**Implicit test:** Function handles both exact and fuzzy section matching; returns None if not found

## Output Validation

### Summary Statistics

Scripts print summary statistics that serve as implicit validation:

**From `comprehensive_customer_analysis.py`:**
```python
print("\n" + "=" * 80)
print("TOP 15 CUSTOMERS BY FY'26 FORECAST")
print("=" * 80)

sorted_by_fy26 = sorted(all_customers, key=lambda x: x['fy26_total'], reverse=True)
for idx, customer in enumerate(sorted_by_fy26[:15], 1):
    print(f"{idx:2d}. {customer['customer'][:50]:50s} | ${customer['fy26_total']:>12,.0f}")
```

**Validates:**
- Sorting works correctly
- Revenue calculation is reasonable (printed values can be reviewed)
- Top customers are identified

### Revenue Concentration Testing

```python
total_fy26 = sum(c['fy26_total'] for c in all_customers)
top_10_revenue = sum(c['fy26_total'] for c in sorted_by_fy26[:10])
top_20_revenue = sum(c['fy26_total'] for c in sorted_by_fy26[:20])

print(f"Total FY'26 Forecast: ${total_fy26:,.0f}")
print(f"Top 10 customers: ${top_10_revenue:,.0f} ({top_10_revenue/total_fy26*100:.1f}%)")
print(f"Top 20 customers: ${top_20_revenue:,.0f} ({top_20_revenue/total_fy26*100:.1f}%)")
```

**Tests:**
- Total revenue sums correctly
- Percentage calculations are accurate (manual review of output)
- Top N selection works as expected

## Region Classification Validation

**In `add_region_to_customers.py`:**

```python
def main():
    # Process each file
    total_stats = {
        'EMEA': 0,
        'APAC': 0,
        'Americas': 0,
        'total': 0
    }

    for file_path in customer_files:
        if not file_path.exists():
            print(f"\nWARNING: File not found: {file_path.name}")
            continue

        stats = update_customer_file(file_path)
        total_stats['EMEA'] += stats['EMEA']
        # ... accumulate stats

    # Print summary
    print(f"Total customers: {total_stats['total']}")
    print(f"EMEA: {total_stats['EMEA']} ({total_stats['EMEA']/total_stats['total']*100:.1f}%)")
    print(f"APAC: {total_stats['APAC']} ({total_stats['APAC']/total_stats['total']*100:.1f}%)")
    print(f"Americas: {total_stats['Americas']} ({total_stats['Americas']/total_stats['total']*100:.1f}%)")
```

**Validates:**
- All customers assigned a region
- Regional distribution is reasonable (100% accounts for all customers)
- File existence checked before processing

## Error Recovery Patterns

**Broad exception handling with graceful fallback:**

```python
try:
    pub_date = datetime(*entry.published_parsed[:6])

    if (datetime.now() - pub_date).days <= days:
        articles.append({
            'title': entry.title,
            'url': entry.link,
            # ...
        })
except:
    continue  # Skip malformed entries
```

**Relevance scoring with defaults:**

```python
def calculate_relevance(self, title, customer_name):
    """Calculate relevance score (0-1) based on keyword matching."""
    title_lower = title.lower()
    name_parts = customer_name.lower().split()

    # Filter out common words
    name_parts = [p for p in name_parts if len(p) > 3]

    if not name_parts:
        return 0.5  # Default middle score

    # Calculate and cap at 1.0
    score = min(matches / max(len(name_parts), 1), 1.0)
```

## Shell Script Testing

**In `update_all_dashboards.sh`:**

```bash
set -e  # Fail fast on any error

# Verify each step creates expected output
CLOUDSENSE_DASHBOARDS=$(ls output/*.html 2>/dev/null | wc -l | xargs)
if [ -z "$CLOUDSENSE_DASHBOARDS" ]; then
    echo "ERROR: No dashboards created"
    exit 1
fi
```

**Validates:**
- Each step executes successfully (set -e stops on error)
- Output files are created at each stage
- File counts are non-zero

## Testing Gaps & Recommendations

**No Unit Tests:** Individual functions lack isolated testing
- **Recommendation:** Add pytest with basic unit tests for critical functions like `classify_region()`, `calculate_relevance()`

**No Integration Tests:** Multi-step data pipelines not tested end-to-end
- **Recommendation:** Create test fixtures with sample data; verify output format and structure

**No Regression Tests:** Previous outputs not compared against current runs
- **Recommendation:** Store baseline outputs; detect breaking changes

**No Data Contract Tests:** Schema of JSON outputs not validated
- **Recommendation:** Use jsonschema library to validate output structure

**Manual Verification Only:** All testing currently relies on human review of print output
- **Recommendation:** Implement CI/CD checks with automated validation

## Running Existing Validation

**Verify dashboard completeness:**
```bash
python3 scripts/verify_dashboard_completeness.py
```

**Run analysis with output validation:**
```bash
python3 comprehensive_customer_analysis.py > /tmp/analysis_output.txt
# Review printed statistics manually
```

**Run full update pipeline with verification:**
```bash
bash scripts/update_all_dashboards.sh
# Final step counts generated files and reports
```

---

*Testing analysis: 2026-02-08*
