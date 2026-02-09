# Codebase Concerns

**Analysis Date:** 2026-02-08

## Error Handling

**Bare Exception Handler:**
- Issue: Overly broad exception handling that masks specific errors
- Files: `scripts/fetch_customer_news.py:37`
- Impact: Silent failures when parsing news feed entries prevent debugging and monitoring of data quality issues
- Fix approach: Replace bare `except:` with specific exception types (e.g., `except (KeyError, AttributeError, TypeError)`) to surface real errors while handling expected parsing failures

**Limited Exception Recovery:**
- Issue: Many file operations lack try/except blocks entirely
- Files: `scripts/create_full_dashboard.py`, `scripts/generate_rich_dashboards.py`, `scripts/generate_dashboards.py`
- Impact: Script crashes if customer data files are missing, corrupted, or have unexpected structure (e.g., `data/customers_cloudsense_all.json` not found)
- Fix approach: Wrap file loading in try/except blocks with informative error messages; validate JSON structure before processing

**Unvalidated Nested Dictionary Access:**
- Issue: Code assumes nested dictionary keys exist without validation
- Files: `scripts/integrate_intelligence_reports.py:20-30`, `scripts/create_full_dashboard.py:127-132`
- Impact: `KeyError` crashes if Excel sheets or JSON files have missing columns or customer objects lack expected fields
- Fix approach: Use `dict.get()` with defaults or validate structure at load time

## Data Validation Gaps

**Missing Customer Data Validation:**
- Issue: No validation that customer records contain required fields before processing
- Files: All scripts in `scripts/` that process `data/customers_*.json`
- Impact: Malformed customer records missing `rank`, `total`, `rr`, or `nrr` fields cause crashes during HTML generation
- Fix approach: Create validation function in shared module that checks all required fields; fail fast with informative errors

**Inconsistent Data Across Business Units:**
- Issue: Customer data file sizes vary significantly (CloudSense 25K vs STL 9.1K)
- Files: `data/customers_cloudsense_all.json`, `data/customers_stl_all.json`, etc.
- Impact: Unknown - could indicate missing records, different data collection methods, or legitimate differences in account sizes
- Fix approach: Add validation script that compares customer counts and total revenue across BU files; document expected variations

**Division by Zero Risk:**
- Issue: Revenue calculations assume `customer['total'] > 0` only in some locations
- Files: `scripts/generate_rich_dashboards.py:310-311`, `scripts/create_full_dashboard.py:128-132`
- Impact: If a customer record has `total=0`, percentage calculations fail or produce misleading results
- Fix approach: Add guard clause at data load time: reject or flag customers with zero/null revenue

**Missing Intelligence Report Data:**
- Issue: ~70% of customers lack corresponding markdown intelligence reports
- Files: `data/intelligence/reports/` (only 28 files for 140+ customers)
- Impact: Dashboard tabs show "Intelligence In Progress" placeholder; users see incomplete account plans
- Fix approach: Prioritize report generation for top 50 customers by revenue; document coverage status in data manifest

## File I/O & Path Handling

**Hardcoded Relative Paths:**
- Issue: All file operations use relative paths assuming script execution from project root
- Files: Every script in `scripts/` (e.g., `data/customers_cloudsense_all.json`, `output/stl/index.html`)
- Impact: Scripts fail silently if run from different directory; brittle for automation/cron jobs
- Fix approach: Use `Path(__file__).parent` or `os.path.abspath()` to make paths project-root-relative; add working directory validation at script start

**Unsafe Filename Generation from Customer Names:**
- Issue: Customer name → filename conversion only handles `/` and spaces
- Files: `scripts/generate_rich_dashboards.py:20`, `scripts/create_full_dashboard.py:41`, `scripts/generate_dashboards.py:29`
- Pattern: `customer_name.replace('/', '-').replace(' ', '_')`
- Impact: Special characters in names (e.g., `&`, `.`, `(`, `)`, `'`) create files that may be inaccessible or conflict with shell/HTML conventions
- Examples: "AT&T SERVICES, INC." → `AT&T_SERVICES,_INC..html` (comma, dots preserved)
- Fix approach: Use sanitization library (e.g., `slugify` from `python-slugify`) or explicit allow-list of safe characters

**No Directory Existence Checks Before File Write:**
- Issue: Code creates `output/` subdirectories but assumes parent directories exist
- Files: `scripts/generate_rich_dashboards.py:525`, `scripts/create_full_dashboard.py:778`
- Impact: If `output/stl/` doesn't exist, file write crashes; scripts should create parent directories first
- Fix approach: Use `os.makedirs(output_dir, exist_ok=True)` before every file write operation

## String Handling & HTML Generation

**XSS/HTML Injection Risk:**
- Issue: Customer names and markdown content inserted directly into HTML without escaping
- Files: `scripts/create_full_dashboard.py:595`, `scripts/generate_rich_dashboards.py:287`, `scripts/generate_dashboards.py` (all variants)
- Pattern: `f"<h1>{customer_name}</h1>"` without HTML escaping
- Impact: If customer name contains HTML tags (e.g., `<script>alert('xss')</script>`) or markdown contains unclosed tags, generated HTML becomes malformed/vulnerable
- Fix approach: Use `html.escape(customer_name)` before inserting into HTML; validate markdown parsing output

**Regex Parsing Fragility:**
- Issue: Complex markdown section extraction via regex patterns with multiple fallback options
- Files: `scripts/create_full_dashboard.py:134-219`, `scripts/integrate_intelligence_reports.py:57-99`
- Pattern: 20+ different section name variations attempted to find "EXECUTIVE LEADERSHIP" content
- Impact: Brittle parsing - small changes to report format (case sensitivity, spacing) cause silent fallbacks to wrong sections or empty content
- Fix approach: Standardize intelligence report markdown template with validated structure; use YAML frontmatter instead of markdown headings

**Unchecked String Slicing:**
- Issue: Code truncates text with hardcoded indices without length validation
- Files: `scripts/generate_rich_dashboards.py:315`, `scripts/integrate_intelligence_reports.py:98`
- Pattern: `alert["text"][:80]` (assumes text is at least 80 characters)
- Impact: If text is shorter than expected index, display looks correct but data is incomplete
- Fix approach: Use `min()` guard: `text[:min(80, len(text))]` or `.ljust()`

## Testing & Monitoring

**No Test Coverage:**
- Issue: Codebase lacks unit tests, integration tests, or test fixtures
- Files: No `.test.py`, `test_*.py`, or `*_test.py` files found
- Impact: Changes to parsing logic, data structures, or file operations can break silently; no regression detection
- Priority: High - data generation scripts are critical path
- Fix approach: Add pytest test suite covering:
  - Customer data file loading and validation
  - Markdown section extraction with multiple report formats
  - Filename sanitization edge cases
  - HTML generation with special characters in customer names

**No Data Manifest or Checksum Validation:**
- Issue: No way to detect corrupted or incomplete data files
- Files: All JSON customer files, intelligence reports
- Impact: If a file becomes corrupted during transmission/storage, scripts fail mysteriously or produce incorrect dashboards
- Fix approach: Generate and version a manifest file (JSON with file paths, line counts, SHA256 hashes) at data generation time; validate before processing

**Silent Failures in News Fetching:**
- Issue: `fetch_customer_news.py` silently continues if feed parsing fails, producing incomplete news data
- Files: `scripts/fetch_customer_news.py:19-43`
- Impact: Dashboards show "no news available" when failure is actually a feed parsing issue
- Fix approach: Log specific parsing failures with customer name and feed URL; add retry logic with exponential backoff for network failures

## Data Consistency & Coverage

**Mismatched Customer Lists Across Files:**
- Issue: Multiple JSON files with similar structure but different customer counts
- Files: `customers_top80.json`, `customers_cloudsense_all.json`, `customers_kandy_all.json`, etc.
- Impact: Unclear which file is canonical; dropdown menus and analytics may show different customer sets
- Fix approach: Document which file is source-of-truth; consolidate to single customer master file with BU field; add automated diff check in CI

**Incomplete Intelligence HTML Extraction:**
- Issue: `data/intelligence_html.json` populated separately, not integrated with markdown reports
- Files: `scripts/generate_rich_dashboards.py:516`, `scripts/generate_dashboards.py` (all variants)
- Impact: Dual sources of intelligence data can diverge; unclear which format is authoritative
- Fix approach: Consolidate to markdown reports only; generate HTML on-demand via consistent markdown parser

**Renewal Date Data Coupling:**
- Issue: Renewal dates extracted from Excel file during script execution, tightly coupling codebase to Excel structure
- Files: `scripts/integrate_intelligence_reports.py:14-50` (reads from `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`)
- Impact: If Excel file is updated/renamed, scripts break; no version control of renewal dates
- Fix approach: Export renewal dates as separate CSV/JSON during budget process; check that file exists before loading

## Scaling & Performance

**Memory Inefficiency with Large Customer Sets:**
- Issue: All customer files loaded entirely into memory before processing
- Files: `scripts/generate_rich_dashboards.py:9-17`, `scripts/create_full_dashboard.py:13-27`
- Impact: If customer set grows to 1000+, memory usage becomes problematic; no streaming/pagination support
- Fix approach: For now acceptable (140 customers = minimal memory); document limit; refactor to streaming if growth exceeds 500 customers

**Regex Performance on Large Markdown Files:**
- Issue: Multiple regex passes on intelligence report content
- Files: `scripts/create_full_dashboard.py:80-99`, `scripts/integrate_intelligence_reports.py:52-99`
- Pattern: 20+ `re.search()` calls per report file
- Impact: If intelligence reports grow to 50K+ lines, parsing becomes noticeably slow
- Fix approach: Profile with real data; consider caching parsed sections; document expected report size

## Security Considerations

**Unrestricted File Write Paths:**
- Issue: Output directory structure determined by user input (business unit parameter)
- Files: `scripts/generate_rich_dashboards.py:510-514`
- Impact: Path traversal risk if `bu_name` contains `../` - could write files outside `output/` directory
- Fix approach: Validate `bu_name` against whitelist (`['CloudSense', 'Kandy', 'STL', 'NewNet']`); reject any containing path separators

**External Data Dependency - News Feeds:**
- Issue: `fetch_customer_news.py` fetches from Google News without rate limiting or timeout
- Files: `scripts/fetch_customer_news.py:14-43`
- Impact: Could be blocked by Google; no retry/fallback if service is down; requests could timeout indefinitely
- Fix approach: Add request timeout (5 seconds), exponential backoff on 429/503, cache responses, add circuit breaker

**Unvalidated Regex Patterns:**
- Issue: User-controlled section names used in `re.escape()` but pattern construction could still be vulnerable
- Files: `scripts/create_full_dashboard.py:86`, `scripts/integrate_intelligence_reports.py:59`
- Impact: Low risk with current usage, but regex DoS possible with extremely long section names
- Fix approach: Validate section names against length limit (max 100 chars); test regex timeout performance

## Fragile Areas Requiring Safe Modification

**Markdown Section Extraction:**
- Files: `scripts/create_full_dashboard.py:134-219`, `scripts/integrate_intelligence_reports.py:52-99`
- Why fragile: Multiple fallback attempts for same section suggest source reports have inconsistent structure
- Safe modification: Before changing extraction logic:
  1. Sample 10 different intelligence reports from each BU
  2. Document observed section heading variations
  3. Create test fixtures with these variations
  4. Run tests before/after to catch regressions

**Customer Name → Filename Transformation:**
- Files: All scripts in `scripts/` using `customer_name.replace()`
- Why fragile: Applied inconsistently; missing special character handling; affects both file generation and navigation
- Safe modification: Before changing:
  1. Audit all customers in `data/customers_*.json` for problematic characters
  2. Create test cases for edge cases (e.g., `"AT&T"`, `"A/B Test"`, `"Co."`)
  3. Update transformation in all locations simultaneously
  4. Test generated HTML loads correctly

**Business Unit Navigation:**
- Files: `scripts/create_full_dashboard.py:251-264`, `scripts/generate_rich_dashboards.py:509-514`
- Why fragile: Hardcoded path assumptions; if directory structure changes, relative links break
- Safe modification: Before restructuring output directories:
  1. Identify all hardcoded BU path references
  2. Create centralized config object for path templates
  3. Update all scripts to use config
  4. Test navigation between BUs after changes

## Known Limitations

**Intelligence Report Coverage:**
- Only 28 of 140+ customers have intelligence reports
- Top priority: CloudSense top 20 customers (highest revenue impact)
- Timeline: Reports generated manually; no automation for new customers

**Business Intelligence HTML Format:**
- `data/intelligence_html.json` appears to be pre-rendered HTML, not markdown-derived
- Unclear how/when this file is updated relative to markdown reports
- Risk: Inconsistency if both sources are maintained

**Vendor Contract Data Dependency:**
- Excel budget file (`2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`) is source-of-truth for renewal dates
- File is not in version control; only customer JSON files are tracked
- Risk: If Excel file becomes unavailable or is updated, scripts break or produce stale data

---

*Concerns audit: 2026-02-08*
