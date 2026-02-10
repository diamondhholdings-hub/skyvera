/**
 * IntelligenceTab - Display AI-generated intelligence insights and news timeline
 * Server Component - displays opportunities, risks, recommendations, and news articles
 */

import { Lightbulb, AlertTriangle, Target } from 'lucide-react'
import type { IntelligenceReport } from '@/lib/types/account-plan'
import type { NewsArticle } from '@/lib/types/news'
import { formatDistanceToNow } from 'date-fns'

interface IntelligenceTabProps {
  intelligenceReport: { raw: string; structured?: IntelligenceReport } | null
  news: { articles: NewsArticle[] } | null
  customerName: string
}

export function IntelligenceTab({ intelligenceReport, news, customerName }: IntelligenceTabProps) {
  const hasIntelligence = intelligenceReport && intelligenceReport.raw
  const hasNews = news && news.articles.length > 0

  return (
    <div className="space-y-8">
      {/* Intelligence Report Section */}
      <div>
        <h2 className="font-display text-xl font-semibold text-secondary mb-4">Strategic Intelligence</h2>

        {hasIntelligence ? (
          <div className="space-y-6">
            {/* Display raw markdown for now - structured parsing in future iteration */}
            <div className="bg-highlight/50 p-6 rounded border-l-3 border-accent shadow-sm">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-ink leading-relaxed">
                  {intelligenceReport.raw.slice(0, 2000)}
                  {intelligenceReport.raw.length > 2000 && (
                    <span className="text-accent"> ... (read full report for more)</span>
                  )}
                </div>
              </div>
              {intelligenceReport.raw.length > 2000 && (
                <p className="text-xs text-muted mt-4 pt-4 border-t border-[var(--border)]">
                  Full intelligence report available - parsed from account analysis
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-warning/10 border-2 border-warning rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#e65100] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#e65100] mb-1">No Intelligence Report Available</h3>
                <p className="text-sm text-[#e65100]">
                  Intelligence data for <strong>{customerName}</strong> has not been generated yet.
                  Check back later for AI-powered insights.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* News Timeline Section */}
      <div>
        <h2 className="font-display text-xl font-semibold text-secondary mb-4">Recent News & Intelligence</h2>

        {hasNews ? (
          <div className="space-y-3">
            {news.articles.map((article, index) => (
              <NewsArticleCard key={index} article={article} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
            <p className="text-slate-600">No recent news available for {customerName}</p>
            <p className="text-sm text-slate-500 mt-1">
              News articles will appear here as they become available
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * NewsArticleCard - Individual news article display
 */
interface NewsArticleCardProps {
  article: NewsArticle
}

function NewsArticleCard({ article }: NewsArticleCardProps) {
  // Strip HTML tags from summary (some news data contains <a> tags)
  const cleanSummary = article.summary.replace(/<[^>]*>/g, '').slice(0, 200)

  // Calculate relative time
  let relativeTime = 'recently'
  try {
    relativeTime = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
  } catch (e) {
    // Invalid date, use fallback
  }

  return (
    <div className="bg-white p-4 rounded border border-[var(--border)] hover:border-accent/30 transition-colors shadow-sm">
      {/* Title */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline font-medium text-sm block mb-2"
      >
        {article.title}
      </a>

      {/* Source and date */}
      <div className="flex items-center gap-2 text-xs text-muted mb-2">
        <span>{article.source}</span>
        <span>•</span>
        <span>{relativeTime}</span>
        {article.relevanceScore && article.relevanceScore > 0.8 && (
          <>
            <span>•</span>
            <span className="text-accent font-medium">High relevance</span>
          </>
        )}
      </div>

      {/* Summary */}
      {cleanSummary && (
        <p className="text-sm text-ink leading-relaxed">
          {cleanSummary}
          {article.summary.length > 200 && '...'}
        </p>
      )}
    </div>
  )
}
