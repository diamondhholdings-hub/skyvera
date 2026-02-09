# External Integrations

**Analysis Date:** 2026-02-08

## APIs & External Services

**News & Intelligence:**
- Google News RSS - Customer news aggregation for business intelligence
  - SDK/Client: feedparser library
  - Endpoint: `https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en`
  - Used in: `scripts/fetch_customer_news.py`
  - No authentication required (public RSS feed)

**Font Services:**
- Google Fonts - Typography delivery
  - Endpoint: `https://fonts.googleapis.com/css2`
  - Fonts: Cormorant Garamond (serif), DM Sans (sans-serif)
  - Used in: All HTML templates and generated dashboards

**Visualization:**
- Chart.js Library - Client-side charting
  - CDN: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`
  - Used in: Dashboard HTML files for KPI visualization

## Data Storage

**Databases:**
- Not applicable - no database backend
- All data sourced from Excel file and static JSON files

**File Storage:**
- Local filesystem only
- Data directories: `data/`, `data/news/`, `data/intelligence/`, `data/intelligence/reports/`
- Output directories: `output/`

**Caching:**
- No external caching service
- RSS feed data cached locally in `data/news/*.json` files
- HTML dashboards cached as static files in `output/`

## Authentication & Identity

**Auth Provider:**
- None - no authentication system in place
- All dashboards are static files accessible to anyone with file access
- No user management or access control implemented

## Monitoring & Observability

**Error Tracking:**
- Not detected - no external error tracking service integrated

**Logs:**
- Console/stdout logging via Python print statements
- Logs output to terminal during script execution
- No centralized logging service

## CI/CD & Deployment

**Hosting:**
- Static file hosting only
- No backend server or cloud infrastructure detected
- Generated HTML files in `output/` directory can be served via any web server

**CI Pipeline:**
- Not detected - no GitHub Actions, GitLab CI, Jenkins, or other CI service
- Manual script execution via bash: `scripts/daily_news_update.sh`
- Daily news updates triggered by local cron job or manual execution

## Environment Configuration

**Required env vars:**
- None detected - no environment variables used

**Secrets location:**
- No secrets management system in place
- No API keys, tokens, or credentials in codebase
- Google News RSS feed is public (no auth needed)

## Data Flow: News Fetching Pipeline

**Incoming Data Sources:**
- Google News RSS feed (public, no authentication)

**Processing:**
1. `scripts/fetch_customer_news.py` queries Google News RSS for each customer
2. feedparser library parses RSS feed
3. Articles filtered by recency (7 days) and relevance score
4. Deduplicated by URL
5. Top 8 articles stored to `data/news/{customer}_news.json`

**Usage:**
- Customer news JSON loaded by dashboard generators
- Integrated into customer account plans and dashboards

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected - no external service notifications

## Data Workflow: Excel to Dashboard

**Input:**
- Excel file: `2025-12-11 Skyvera - Budget - Q1'26 - For Todd.xlsx`
  - Sheets used: RR Input, NRR Input, HC Budget Input, Vendor Pivots, AR Aging
  - Read via openpyxl library: `scripts/extract_*.py` files

**Processing:**
1. openpyxl reads Excel sheets (`scripts/extract_all_customers.py`, `scripts/extract_kandy_customers.py`, etc.)
2. Customer data extracted and normalized to JSON: `data/customers_*.json`
3. Intelligence reports in markdown format (`data/intelligence/reports/*.md`)
4. markdown2 converts reports to HTML snippets
5. Dashboard generators (`scripts/generate_dashboards.py`) combine:
   - Customer JSON data
   - Intelligence HTML
   - News JSON
   - Chart.js visualizations
6. Output: Static HTML files in `output/`

**Output:**
- HTML dashboards served as static files
- One HTML per customer: `output/{customer_name}.html`
- Index pages for navigation: `output/index.html`

## Third-Party Libraries & CDNs

**JavaScript Libraries (Client-Side):**
- Chart.js 4.4.0 (visualization)
  - Source: jsDelivr CDN
  - License: MIT

**Fonts (External CDN):**
- Google Fonts (Cormorant Garamond, DM Sans)
  - Source: Google Fonts API
  - License: Open Source

**Python Packages:**
- openpyxl - Read/write Excel files (open source)
- feedparser - Parse RSS/Atom feeds (open source)
- requests - HTTP client library (open source)
- markdown2 - Markdown to HTML converter (open source)

## Security Considerations

**External Dependencies:**
- All JavaScript loaded from jsDelivr CDN - no integrity checks detected
- Google Fonts loaded via HTTPS
- Google News RSS feed is public, no authentication bypass risk

**Data Storage:**
- Excel budget file contains sensitive financial data - stored locally only
- No data sync to external cloud services

**Access Control:**
- Static HTML files accessible to anyone with filesystem access
- No authentication or authorization layer

---

*Integration audit: 2026-02-08*
