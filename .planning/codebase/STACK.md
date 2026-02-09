# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**
- Python 3 - Core scripting language for data processing, dashboard generation, and analysis
- HTML5 - Frontend presentation layer for dashboards and account plans
- CSS3 - Styling for web interfaces
- JavaScript (vanilla) - Client-side interactivity in dashboards

**Secondary:**
- Bash - Shell scripting for automation workflows (daily news updates, batch processing)
- JSON - Data serialization and configuration

## Runtime

**Environment:**
- Python 3 (specific version not locked in repository)
- Bash shell (macOS/Unix compatible)
- Web browsers (modern ES5+ compatible)

**Package Manager:**
- pip3 - Python package management
- No lockfile detected (requirements.txt not present)

## Frameworks

**Core:**
- openpyxl 3.x - Excel file reading and data extraction from budget files
- feedparser - RSS feed parsing for customer news aggregation
- requests - HTTP client for fetching web content (used in news fetching)
- markdown2 - Markdown to HTML conversion for intelligence reports

**Frontend:**
- Chart.js 4.4.0+ - Data visualization library (via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`)

**Build/Dev:**
- No build system detected
- HTML templates generate output directly from Python scripts

## Key Dependencies

**Critical:**
- openpyxl - Reads Excel budget file `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx` which contains all financial data, customer RR/NRR, headcount budgets, and vendor costs
- feedparser - Aggregates Google News RSS feeds for customer intelligence
- markdown2 - Converts markdown intelligence reports to HTML for dashboard integration
- requests - HTTP requests for news fetching

**External Visualization:**
- Chart.js 4.4.0 - Charts and data visualization (loaded from jsDelivr CDN)
- Google Fonts - Typography (Cormorant Garamond, DM Sans) via `https://fonts.googleapis.com/`

## Configuration

**Environment:**
- No environment variables detected - all configuration is hardcoded or file-based
- No .env files present in repository

**Build:**
- Python scripts directly generate HTML files
- No build configuration files (no webpack, vite, rollup, etc.)
- HTML templates: `templates/account_plan_base.html`

## Data Files & Storage

**Input Data:**
- Excel budget file: `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`
  - Sheets: P&Ls, RR Input, NRR Input, HC Budget Input, Vendor Pivots, AR Aging
  - Customer data extracted to JSON: `data/customers_*.json`

**Output Data:**
- Generated HTML dashboards: `output/*.html`
- JSON data files: `data/*.json`, `data/news/*.json`, `data/intelligence_html.json`
- Markdown reports: `data/intelligence/reports/*.md`

## Platform Requirements

**Development:**
- macOS/Unix/Linux system (paths use Unix-style separators)
- Python 3.x with pip3
- Bash shell
- Text editor or IDE

**Production:**
- Web server to serve static HTML files (or direct browser file access)
- No backend server required - fully static output
- No database backend

## External CDN Dependencies

**JavaScript:**
- Chart.js 4.4.0 from jsDelivr: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`

**Fonts:**
- Google Fonts API: `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&display=swap`

**Static CDN:**
- jsDelivr for Chart.js hosting

---

*Stack analysis: 2026-02-08*
