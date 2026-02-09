# Coding Conventions

**Analysis Date:** 2026-02-08

## Language & Environment

**Primary Language:** Python 3
- Scripts use `#!/usr/bin/env python3` shebang
- All executable scripts marked with executable permissions
- No type hints currently in use

**Shell Scripts:** Bash
- Used for automation and orchestration (`.sh` files)
- Set `set -e` for error handling (fail fast on errors)

## Naming Patterns

**Files:**
- Snake case for Python files: `generate_dashboards.py`, `extract_all_customers.py`, `fetch_customer_news.py`
- Script files in `scripts/` directory follow business unit patterns: `generate_dashboards_kandy.py`, `generate_index_stl.py`
- Data files use descriptive naming: `customers_cloudsense_all.json`, `intelligence_html.json`

**Functions:**
- Snake case: `load_customers()`, `parse_customer_sheet()`, `classify_region()`, `generate_customer_dropdown_options()`
- Descriptive and action-oriented: `extract_all_rr()`, `fetch_google_news()`, `calculate_relevance()`
- Helper functions prefixed with underscore not observed; all functions public
- Private helper functions at module level, not class methods

**Variables:**
- Snake case for all variables: `customer_name`, `bu_revenue`, `total_fy26`, `file_path`
- Dictionary keys use snake case: `'customer_name'`, `'rr'`, `'nrr'`, `'subscriptions'`
- Abbreviations in use: `rr` (recurring revenue), `nrr` (non-recurring revenue), `bu` (business unit), `ttm` (trailing twelve months)
- Counters use descriptive names: `total_customers`, `bu_customer_count`, `article_count`

**Classes:**
- PascalCase: `CustomerNewsFetcher` (in `fetch_customer_news.py`)
- One class per file (or no classes for data processing scripts)

**Constants:**
- Not commonly used; magic strings and numbers appear inline with comments
- Example: `headers = []` then `headers = list(row)` pattern
- File paths as string literals: `'data/customers_top80.json'`, `'RR Input'` (Excel sheet names)

## Code Style

**Formatting:**
- No formatter enforced (no `.prettierrc`, `black`, or `autopep8` config found)
- Inconsistent line lengths observed (some lines exceed 100 characters)
- Indentation: 4 spaces (Python standard)

**Linting:**
- No linter configuration found (no `.eslintrc`, `.pylintrc`, `flake8`, or `pyproject.toml`)
- No pre-commit hooks configured

**Comments:**
- Minimal inline comments; code is self-documenting through function/variable names
- Module-level docstrings present in most files
- Example from `comprehensive_customer_analysis.py`:
  ```python
  """
  Comprehensive customer analysis from RR Input and NRR Input tabs
  """
  ```
- Function docstrings with multi-line descriptions in some files (e.g., `add_region_to_customers.py`)
- Print statements serve as inline documentation during execution

**Docstrings:**
- Double-quoted triple quotes used: `"""docstring"""`
- Args/Returns format observed in `add_region_to_customers.py`:
  ```python
  def classify_region(customer_name):
      """
      Classify customer into region based on name patterns.

      Args:
          customer_name (str): Customer company name

      Returns:
          str: Region code - 'EMEA', 'APAC', or 'Americas'
      """
  ```
- Inconsistent: Not all functions have docstrings

## Import Organization

**Order:**
1. Standard library imports
2. Third-party imports
3. Local module imports (rarely used; mostly procedural scripts)

**Example from `generate_tabbed_dashboards.py`:**
```python
import json
import os
from datetime import datetime
```

**Example from `fetch_customer_news.py`:**
```python
import feedparser
import requests
from datetime import datetime, timedelta
import json
import os
from urllib.parse import quote_plus
import re
```

**Path Aliases:**
- Not used; relative paths preferred: `'data/customers_top80.json'`, `'scripts/add_region_to_customers.py'`
- Path construction with `Path` from `pathlib`: `data_dir / 'customers_top80.json'`
- Direct string concatenation: `f"{customer_name.replace('/', '-').replace(' ', '_')}_news.json"`

**Import Patterns:**
- All imports at module top level (no mid-function imports except regex in some parsing functions)
- Occasional lazy imports: `import re` inside functions when only used in specific code paths (seen in `generate_dashboards.py`, `generate_tabbed_dashboards.py`)

## Error Handling

**Patterns:**
- Try-except with generic exception catching (broad exception handling)
  ```python
  try:
      feed = feedparser.parse(url)
      # ... processing
  except Exception as e:
      print(f"  ⚠ Google News fetch failed: {e}")
      return []
  ```

- Silent continues on errors:
  ```python
  except:
      continue
  ```
  Seen in `fetch_customer_news.py` and `comprehensive_customer_analysis.py`

- File existence checks before processing:
  ```python
  if os.path.exists(filepath):
      with open(filepath, 'r') as f:
          return json.load(f)
  return None
  ```

- Row validation patterns:
  ```python
  if not customer_name or customer_name in ['Customer', None, '']:
      continue
  ```

- Type and value validation before conversion:
  ```python
  q1_26 = float(row[8]) if len(row) > 8 and row[8] is not None and str(row[8]).replace('.', '').replace('-', '').isdigit() else 0.0
  ```

**No custom exception classes observed** - relies on built-in exceptions

**No logging framework** - uses `print()` statements for all output

## Function Design

**Size:**
- Small functions (10-50 lines typical)
- Some parsing functions larger (50-100+ lines) with multiple loops
- Example: `parse_customer_sheet()` is 70 lines with nested loops

**Parameters:**
- Positional parameters common (not keyword-only)
- Functions typically 1-4 parameters
- Dictionary/list unpacking not used
- Single responsibility: each function does one thing

**Return Values:**
- Explicit returns of collections (lists, dicts)
- None returns for missing data: `return None` when file doesn't exist
- Tuples for multiple return values: `(customer, change, pct_change)`
- No exception raising observed - graceful degradation with None/empty returns

**Example clean function from `add_region_to_customers.py`:**
```python
def classify_region(customer_name):
    """Classify customer into region based on name patterns."""
    name_lower = customer_name.lower()

    company_mappings = {
        'emircom': 'EMEA',
        'liquid telecom': 'EMEA',
        # ... more mappings
    }

    # Check specific company mappings first
    for company, region in company_mappings.items():
        if company in name_lower:
            return region

    # Fall through to pattern matching
    # ...
    return 'Americas'
```

## Module Design

**Structure:**
- Procedural scripts: functions defined at module level, called in `if __name__ == '__main__':` blocks
- Data processing followed by output generation
- No class hierarchies (one class: `CustomerNewsFetcher`)
- No inheritance observed

**Main Block Pattern:**
```python
def main():
    """Main execution function."""
    # Setup and processing
    print("Starting process...")

    # Do work
    result = process_data()

    # Report results
    print(f"Complete: {result}")

if __name__ == '__main__':
    main()
```

**Exports:**
- No explicit `__all__` definitions
- All functions at module level are implicitly exported
- Shell scripts call Python scripts directly: `python3 scripts/generate_dashboards.py`

**Barrel Files:**
- Not used; no `__init__.py` files in `scripts/` directory

## Logging & Output

**Framework:** `print()` statements only

**Patterns:**
- Console output for progress: `print("Processing: ...")`
- Status indicators with unicode: `✅`, `⚠️`, `❌`, `🚨`
- Formatted tables with alignment: `f"{idx:2d}. {customer_name[:50]:50s}"`
- Separators for sections: `print("=" * 80)`
- Timestamps in shell scripts: `echo "[STEP 1/7] EXTRACTING CUSTOMER DATA - $(date '+%H:%M:%S')"`

**Example output pattern:**
```python
print("\n" + "=" * 80)
print("ANALYZING: RR Input")
print("=" * 80)
print(f"\nFound {len(at_risk)} customers at risk:")
```

## JSON Handling

**Serialization Pattern:**
```python
with open(filepath, 'w') as f:
    json.dump(data, f, indent=2)
```

**Deserialization Pattern:**
```python
with open(filepath, 'r') as f:
    return json.load(f)['customers']
```

**Data Structure Convention:**
- Wrap in top-level object with descriptive keys: `{'customers': [...]}`, `{'summary': {...}, 'top_customers': [...]}`
- Consistent field naming: `'customer_name'`, `'revenue_type'`, `'subscriptions'`

## Excel Integration (openpyxl)

**Loading Pattern:**
```python
wb = load_workbook(file_path, data_only=True)  # Always use data_only=True
ws = wb['Sheet Name']
```

**Iteration Pattern:**
```python
for row in ws.iter_rows(values_only=True, min_row=11):
    customer_name = row[1]  # Column B
    arr = row[6]            # Column G
```

**No `max_row` iteration** - relies on exhaustion of `iter_rows()`

## Bash Script Conventions

**Error Handling:** `set -e` enables fail-fast
**Output:** Echo messages with progress indicators
**Conditionals:** Test file existence: `if [ -f "file.py" ]; then`
**Variables:** Uppercase for globals: `REPO_DIR="/path"`, `STEP_NUM=1`
**Functions:** Snake case: `count_files()` pattern not used; mostly inline scripts

## Regular Expression Patterns

**Usage:**
- Used for markdown section extraction: `r'##\s+(.+?)$'`
- Email/URL validation minimal
- Character class escaping: `re.escape(section_name)` to prevent injection

**Flags:**
- `re.DOTALL` for multiline matching
- `re.IGNORECASE` for case-insensitive matching
- `re.MULTILINE` for line-based anchors

---

*Convention analysis: 2026-02-08*
