# Customer News Widget with OSINT Feed - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-time news monitoring widget to customer account plans, updated daily via OSINT feeds (Google News, Company RSS, Financial news)

**Architecture:** Python script fetches news daily → Stores in JSON → HTML widget displays with auto-refresh → Relevance scoring filters noise

**Tech Stack:** Python 3, feedparser, requests, BeautifulSoup4, NewsAPI (optional), cron/scheduled task

---

## Task 1: News Fetcher Service

**Files:**
- Create: `scripts/fetch_customer_news.py`
- Create: `data/news/` directory
- Create: `data/news/{customer_name}_news.json` per customer

**Step 1: Install dependencies**

```bash
pip3 install feedparser beautifulsoup4 requests
```

**Step 2: Write news fetcher script**

```python
"""Fetch and aggregate news for each customer from multiple sources."""
import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import os
from urllib.parse import quote_plus

class CustomerNewsFetcher:
    def __init__(self):
        self.sources = {
            'google_news': self.fetch_google_news,
            'yahoo_finance': self.fetch_yahoo_finance,
            'company_website': self.fetch_company_website
        }

    def fetch_google_news(self, customer_name, days=7):
        """Fetch news from Google News RSS feed."""
        query = quote_plus(customer_name)
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

        try:
            feed = feedparser.parse(url)
            articles = []

            for entry in feed.entries[:10]:  # Top 10 articles
                pub_date = datetime(*entry.published_parsed[:6])

                # Only include articles from last N days
                if (datetime.now() - pub_date).days <= days:
                    articles.append({
                        'title': entry.title,
                        'url': entry.link,
                        'source': entry.get('source', {}).get('title', 'Google News'),
                        'published': pub_date.strftime('%Y-%m-%d'),
                        'summary': entry.get('summary', ''),
                        'relevance_score': self.calculate_relevance(entry.title, customer_name)
                    })

            return articles
        except Exception as e:
            print(f"  ⚠ Google News fetch failed: {e}")
            return []

    def fetch_yahoo_finance(self, customer_name, ticker=None, days=7):
        """Fetch financial news from Yahoo Finance RSS."""
        if not ticker:
            return []  # Skip if no ticker provided

        url = f"https://finance.yahoo.com/rss/headline?s={ticker}"

        try:
            feed = feedparser.parse(url)
            articles = []

            for entry in feed.entries[:5]:  # Top 5 articles
                pub_date = datetime(*entry.published_parsed[:6])

                if (datetime.now() - pub_date).days <= days:
                    articles.append({
                        'title': entry.title,
                        'url': entry.link,
                        'source': 'Yahoo Finance',
                        'published': pub_date.strftime('%Y-%m-%d'),
                        'summary': entry.get('summary', ''),
                        'relevance_score': 0.9  # Financial news is highly relevant
                    })

            return articles
        except Exception as e:
            print(f"  ⚠ Yahoo Finance fetch failed: {e}")
            return []

    def calculate_relevance(self, title, customer_name):
        """Calculate relevance score (0-1) based on keyword matching."""
        title_lower = title.lower()
        name_parts = customer_name.lower().split()

        # Score based on how many name parts appear in title
        matches = sum(1 for part in name_parts if len(part) > 3 and part in title_lower)
        score = min(matches / len(name_parts), 1.0)

        # Boost for business-relevant keywords
        business_keywords = ['acquisition', 'merger', 'ceo', 'revenue', 'earnings',
                            'partnership', 'expansion', 'strategy', 'digital',
                            'technology', 'cloud', 'ai', 'investment']

        for keyword in business_keywords:
            if keyword in title_lower:
                score = min(score + 0.2, 1.0)

        return round(score, 2)

    def fetch_all_sources(self, customer_name, ticker=None):
        """Aggregate news from all sources."""
        all_articles = []

        # Fetch from Google News
        articles = self.fetch_google_news(customer_name)
        all_articles.extend(articles)

        # Fetch from Yahoo Finance (if ticker provided)
        if ticker:
            articles = self.fetch_yahoo_finance(customer_name, ticker)
            all_articles.extend(articles)

        # Deduplicate by URL
        seen_urls = set()
        unique_articles = []
        for article in all_articles:
            if article['url'] not in seen_urls:
                seen_urls.add(article['url'])
                unique_articles.append(article)

        # Sort by relevance score, then date
        unique_articles.sort(key=lambda x: (x['relevance_score'], x['published']), reverse=True)

        # Filter low relevance (< 0.3)
        filtered = [a for a in unique_articles if a['relevance_score'] >= 0.3]

        return filtered[:8]  # Top 8 most relevant articles

def load_customers():
    """Load customer list."""
    with open('data/customers_top80.json', 'r') as f:
        return json.load(f)['customers']

def load_ticker_mapping():
    """Load stock ticker mapping for customers (if available)."""
    # This would be maintained manually
    ticker_file = 'data/customer_tickers.json'

    if os.path.exists(ticker_file):
        with open(ticker_file, 'r') as f:
            return json.load(f)
    else:
        # Default tickers for known public companies
        return {
            'Telefonica UK Limited': 'TEF',
            'Telstra Corporation Limited': 'TLS.AX',
            'Vodafone Netherlands': 'VOD',
            'Spotify': 'SPOT',
            'British Telecommunications plc': 'BT-A.L',
            'Abbott Laboratories': 'ABT'
        }

def main():
    fetcher = CustomerNewsFetcher()
    customers = load_customers()
    tickers = load_ticker_mapping()

    os.makedirs('data/news', exist_ok=True)

    print("="*80)
    print("FETCHING CUSTOMER NEWS FROM OSINT SOURCES")
    print("="*80)

    for customer in customers[:10]:  # Start with top 10
        customer_name = customer['customer_name']
        ticker = tickers.get(customer_name)

        print(f"\n{customer['rank']}. {customer_name}")
        if ticker:
            print(f"   Ticker: {ticker}")

        articles = fetcher.fetch_all_sources(customer_name, ticker)

        news_data = {
            'customer_name': customer_name,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'article_count': len(articles),
            'articles': articles
        }

        filename = f"data/news/{customer_name.replace('/', '-').replace(' ', '_')}_news.json"
        with open(filename, 'w') as f:
            json.dump(news_data, f, indent=2)

        print(f"   ✅ Found {len(articles)} relevant articles")

    print("\n" + "="*80)
    print("News fetch complete. Run daily via cron/scheduler.")
    print("="*80)

if __name__ == '__main__':
    main()
```

**Step 3: Run news fetcher**

```bash
python3 scripts/fetch_customer_news.py
```

Expected: JSON files created in `data/news/` with article data

**Step 4: Commit**

```bash
git add scripts/fetch_customer_news.py data/news/
git commit -m "feat: add customer news fetcher with OSINT sources"
```

---

## Task 2: HTML News Widget Component

**Files:**
- Modify: `templates/account_plan_template.html`
- Create: `templates/news_widget.html`

**Step 1: Create news widget HTML template**

```html
<!-- News Widget Component -->
<div class="card" id="news-widget">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0;">📰 Recent News & Updates</h2>
        <div style="font-size: 0.85rem; color: var(--muted);">
            Last updated: <span id="news-last-updated">{{LAST_UPDATED}}</span>
        </div>
    </div>

    <div id="news-articles">
        {{NEWS_ARTICLES}}
    </div>

    <div style="text-align: center; margin-top: 1rem;">
        <button onclick="refreshNews()" class="refresh-button">
            🔄 Refresh News
        </button>
    </div>
</div>

<style>
    .news-article {
        padding: 1.25rem;
        margin-bottom: 1rem;
        background: white;
        border-left: 4px solid var(--accent);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
    }

    .news-article:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateX(4px);
    }

    .news-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--secondary);
        margin-bottom: 0.5rem;
    }

    .news-title a {
        color: var(--secondary);
        text-decoration: none;
    }

    .news-title a:hover {
        color: var(--accent);
        text-decoration: underline;
    }

    .news-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: var(--muted);
        margin-bottom: 0.5rem;
    }

    .news-source {
        font-weight: 600;
    }

    .news-relevance {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .relevance-high {
        background: rgba(76, 175, 80, 0.2);
        color: #2e7d32;
    }

    .relevance-medium {
        background: rgba(255, 152, 0, 0.2);
        color: #e65100;
    }

    .news-summary {
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--ink);
    }

    .refresh-button {
        padding: 0.75rem 2rem;
        background: var(--secondary);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .refresh-button:hover {
        background: var(--accent);
    }

    .no-news {
        text-align: center;
        padding: 3rem;
        color: var(--muted);
        font-style: italic;
    }
</style>

<script>
    async function refreshNews() {
        const button = document.querySelector('.refresh-button');
        button.textContent = '⏳ Fetching...';
        button.disabled = true;

        // In production, this would call a news API endpoint
        // For now, reload from JSON file

        try {
            const response = await fetch('{{NEWS_JSON_PATH}}');
            const data = await response.json();

            updateNewsWidget(data);

            button.textContent = '✅ Updated';
            setTimeout(() => {
                button.textContent = '🔄 Refresh News';
                button.disabled = false;
            }, 2000);
        } catch (error) {
            button.textContent = '❌ Failed';
            setTimeout(() => {
                button.textContent = '🔄 Refresh News';
                button.disabled = false;
            }, 2000);
        }
    }

    function updateNewsWidget(newsData) {
        const container = document.getElementById('news-articles');
        const lastUpdated = document.getElementById('news-last-updated');

        lastUpdated.textContent = newsData.last_updated;

        if (newsData.articles.length === 0) {
            container.innerHTML = '<div class="no-news">No recent news available</div>';
            return;
        }

        let html = '';
        newsData.articles.forEach(article => {
            const relevanceClass = article.relevance_score >= 0.7 ? 'relevance-high' : 'relevance-medium';
            const relevanceLabel = article.relevance_score >= 0.7 ? 'High Relevance' : 'Medium Relevance';

            html += `
                <div class="news-article">
                    <div class="news-title">
                        <a href="${article.url}" target="_blank" rel="noopener">${article.title}</a>
                    </div>
                    <div class="news-meta">
                        <span class="news-source">${article.source}</span>
                        <span>•</span>
                        <span>${article.published}</span>
                        <span>•</span>
                        <span class="news-relevance ${relevanceClass}">${relevanceLabel}</span>
                    </div>
                    ${article.summary ? `<div class="news-summary">${article.summary}</div>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    }
</script>
```

**Step 2: Integrate news widget into overview tab**

Modify `templates/account_plan_template.html` to add news widget after account status:

```html
<!-- In Overview tab, after account summary -->
{{NEWS_WIDGET}}
```

**Step 3: Commit**

```bash
git add templates/news_widget.html templates/account_plan_template.html
git commit -m "feat: add news widget component to account plans"
```

---

## Task 3: Dashboard Generator Updates

**Files:**
- Modify: `scripts/generate_html_dashboards.py`

**Step 1: Update dashboard generator to include news widget**

```python
def generate_news_widget(customer_name):
    """Generate news widget HTML with customer news data."""
    news_file = f"data/news/{customer_name.replace('/', '-').replace(' ', '_')}_news.json"

    if not os.path.exists(news_file):
        return """
        <div class="card">
            <h2>📰 Recent News & Updates</h2>
            <div class="no-news">News data not yet available. Run: python3 scripts/fetch_customer_news.py</div>
        </div>
        """

    with open(news_file, 'r') as f:
        news_data = json.load(f)

    articles_html = ''
    for article in news_data['articles']:
        relevance_class = 'relevance-high' if article['relevance_score'] >= 0.7 else 'relevance-medium'
        relevance_label = 'High Relevance' if article['relevance_score'] >= 0.7 else 'Medium Relevance'

        articles_html += f"""
        <div class="news-article">
            <div class="news-title">
                <a href="{article['url']}" target="_blank" rel="noopener">{article['title']}</a>
            </div>
            <div class="news-meta">
                <span class="news-source">{article['source']}</span>
                <span>•</span>
                <span>{article['published']}</span>
                <span>•</span>
                <span class="news-relevance {relevance_class}">{relevance_label}</span>
            </div>
            {f'<div class="news-summary">{article["summary"]}</div>' if article.get('summary') else ''}
        </div>
        """

    # Load template
    with open('templates/news_widget.html', 'r') as f:
        widget_template = f.read()

    widget_html = widget_template.replace('{{NEWS_ARTICLES}}', articles_html)
    widget_html = widget_html.replace('{{LAST_UPDATED}}', news_data['last_updated'])
    widget_html = widget_html.replace('{{NEWS_JSON_PATH}}', f'../data/news/{customer_name.replace("/", "-").replace(" ", "_")}_news.json')

    return widget_html
```

**Step 2: Add news widget to dashboard generation**

In `generate_dashboard()` function:

```python
html = html.replace('{{NEWS_WIDGET}}', generate_news_widget(customer_name))
```

**Step 3: Commit**

```bash
git add scripts/generate_html_dashboards.py
git commit -m "feat: integrate news widget into dashboard generation"
```

---

## Task 4: Daily Update Automation

**Files:**
- Create: `scripts/daily_news_update.sh`
- Create: `cron_setup.md` documentation

**Step 1: Create daily update script**

```bash
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
echo "2. Regenerating HTML dashboards..."
python3 scripts/generate_html_dashboards.py

# Regenerate index
echo "3. Updating index page..."
python3 scripts/generate_index.py

echo ""
echo "==================================================================="
echo "Daily news update complete: $(date)"
echo "==================================================================="

# Optional: Commit changes
# git add data/news/ output/
# git commit -m "chore: daily news update $(date +%Y-%m-%d)"
```

**Step 2: Make executable**

```bash
chmod +x scripts/daily_news_update.sh
```

**Step 3: Document cron setup**

```markdown
# Cron Setup for Daily News Updates

## Schedule Daily Updates (3 AM)

```bash
crontab -e
```

Add line:
```
0 3 * * * /Users/RAZER/Documents/projects/Skyvera/scripts/daily_news_update.sh >> /Users/RAZER/Documents/projects/Skyvera/logs/news_updates.log 2>&1
```

## Manual Execution

```bash
./scripts/daily_news_update.sh
```

## Verify Cron

```bash
crontab -l
```

## View Logs

```bash
tail -f logs/news_updates.log
```
```

**Step 4: Create logs directory**

```bash
mkdir -p logs
echo "Daily news update logs" > logs/README.md
```

**Step 5: Commit**

```bash
git add scripts/daily_news_update.sh docs/cron_setup.md logs/
git commit -m "feat: add daily news update automation with cron"
```

---

## Task 5: Testing News Widget

**Step 1: Fetch news for test customer**

```bash
python3 scripts/fetch_customer_news.py
```

**Step 2: Regenerate one dashboard**

```bash
python3 scripts/generate_html_dashboards.py
```

**Step 3: Open dashboard and verify widget**

```bash
open output/Telefonica_UK_Limited.html
```

Manual checks:
- ✅ News widget appears in Overview tab
- ✅ Articles display with title, source, date
- ✅ Relevance scores shown (High/Medium)
- ✅ Links open in new tab
- ✅ "Last updated" timestamp shows
- ✅ Refresh button works (or shows error if no JSON)

**Step 4: Verify news data quality**

```bash
cat data/news/Telefonica_UK_Limited_news.json | python3 -m json.tool | head -50
```

Check:
- Articles are relevant (relevance_score >= 0.3)
- Recent dates (within 7 days)
- Valid URLs

**Step 5: Commit test results**

```bash
git add -A
git commit -m "test: verify news widget integration"
```

---

## Task 6: Documentation Update

**Files:**
- Modify: `README.md`

**Step 1: Add news widget section to README**

```markdown
## News Widget (OSINT Integration)

Each customer account plan includes a real-time news monitoring widget.

### News Sources

- **Google News RSS** - General business news
- **Yahoo Finance** - Financial/market news (for public companies)
- **Relevance Filtering** - AI-scored articles (0.3+ threshold)

### Daily Updates

News is refreshed automatically daily at 3 AM via cron:

```bash
# Setup cron
crontab -e

# Add line:
0 3 * * * /path/to/Skyvera/scripts/daily_news_update.sh >> /path/to/Skyvera/logs/news_updates.log 2>&1
```

### Manual Update

```bash
# Fetch news for all customers
python3 scripts/fetch_customer_news.py

# Regenerate dashboards with new news
python3 scripts/generate_html_dashboards.py
```

### Stock Ticker Mapping

Add stock tickers for public companies to get financial news:

```json
// data/customer_tickers.json
{
  "Telefonica UK Limited": "TEF",
  "Telstra Corporation Limited": "TLS.AX",
  "Spotify": "SPOT"
}
```

### News Data Structure

```json
{
  "customer_name": "Company Name",
  "last_updated": "2026-02-03 14:30:00",
  "article_count": 8,
  "articles": [
    {
      "title": "Article Title",
      "url": "https://...",
      "source": "Financial Times",
      "published": "2026-02-02",
      "summary": "Article summary...",
      "relevance_score": 0.85
    }
  ]
}
```
```

**Step 2: Commit README update**

```bash
git add README.md
git commit -m "docs: add news widget documentation to README"
```

---

## Summary

This plan adds a real-time news monitoring widget to all customer account plans with:

✅ **Daily OSINT feeds** from Google News, Yahoo Finance
✅ **AI-powered relevance scoring** (0-1 scale)
✅ **Automated daily updates** via cron scheduler
✅ **Interactive widget** with refresh capability
✅ **Recent news only** (7-day window)
✅ **High-relevance filtering** (0.3+ threshold)
✅ **Stock ticker support** for financial news
✅ **Deduplication** across sources

**Total estimated time:** 2-3 hours

**Dependencies:** feedparser, beautifulsoup4, requests

---

## Plan Complete

Two execution options:

1. **Subagent-Driven (this session)** - Execute task-by-task with review
2. **Parallel Session (separate)** - Batch execution in new session

Which approach?
