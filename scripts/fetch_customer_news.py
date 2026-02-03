"""Fetch customer news from OSINT sources."""
import feedparser
import requests
from datetime import datetime, timedelta
import json
import os
from urllib.parse import quote_plus
import re

class CustomerNewsFetcher:
    def __init__(self):
        self.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

    def fetch_google_news(self, customer_name, days=7):
        """Fetch news from Google News RSS feed."""
        query = quote_plus(customer_name)
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

        try:
            feed = feedparser.parse(url)
            articles = []

            for entry in feed.entries[:15]:  # Top 15 articles
                try:
                    pub_date = datetime(*entry.published_parsed[:6])

                    # Only include recent articles
                    if (datetime.now() - pub_date).days <= days:
                        articles.append({
                            'title': entry.title,
                            'url': entry.link,
                            'source': entry.get('source', {}).get('title', 'Google News'),
                            'published': pub_date.strftime('%Y-%m-%d'),
                            'summary': entry.get('summary', '')[:200],
                            'relevance_score': self.calculate_relevance(entry.title, customer_name)
                        })
                except:
                    continue

            return articles
        except Exception as e:
            print(f"  ⚠ Google News fetch failed: {e}")
            return []

    def calculate_relevance(self, title, customer_name):
        """Calculate relevance score (0-1) based on keyword matching."""
        title_lower = title.lower()
        name_parts = customer_name.lower().split()

        # Filter out common words
        name_parts = [p for p in name_parts if len(p) > 3 and p not in ['limited', 'corp', 'inc', 'llc', 'ltd']]

        if not name_parts:
            return 0.5

        # Score based on name part matches
        matches = sum(1 for part in name_parts if part in title_lower)
        score = min(matches / max(len(name_parts), 1), 1.0)

        # Boost for business-relevant keywords
        business_keywords = [
            'acquisition', 'merger', 'ceo', 'revenue', 'earnings', 'profit',
            'partnership', 'expansion', 'strategy', 'digital', 'technology',
            'cloud', 'ai', 'investment', 'launch', 'innovation', 'growth',
            'contract', 'deal', 'agreement', 'transformation'
        ]

        keyword_matches = sum(1 for keyword in business_keywords if keyword in title_lower)
        if keyword_matches > 0:
            score = min(score + (keyword_matches * 0.15), 1.0)

        return round(score, 2)

    def fetch_all_sources(self, customer_name):
        """Aggregate news from all sources."""
        all_articles = []

        # Fetch from Google News
        articles = self.fetch_google_news(customer_name, days=7)
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

def main():
    fetcher = CustomerNewsFetcher()
    customers = load_customers()

    os.makedirs('data/news', exist_ok=True)

    print("="*100)
    print("FETCHING CUSTOMER NEWS FROM OSINT SOURCES")
    print("="*100)
    print(f"\nFetching news for top 10 customers...\n")

    for customer in customers[:10]:  # Start with top 10
        customer_name = customer['customer_name']

        print(f"#{customer['rank']:<3} {customer_name[:50]:<50} ", end='', flush=True)

        articles = fetcher.fetch_all_sources(customer_name)

        news_data = {
            'customer_name': customer_name,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'article_count': len(articles),
            'articles': articles
        }

        filename = f"{customer_name.replace('/', '-').replace(' ', '_')}_news.json"
        filepath = f"data/news/{filename}"

        with open(filepath, 'w') as f:
            json.dump(news_data, f, indent=2)

        print(f"✅ {len(articles)} articles")

    print("\n" + "="*100)
    print("✅ News fetch complete")
    print(f"📁 Saved to: data/news/")
    print("="*100)
    print("\nRun daily via: ./scripts/daily_news_update.sh")

if __name__ == '__main__':
    main()
