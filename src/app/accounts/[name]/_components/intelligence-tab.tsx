/**
 * IntelligenceTab - Telstra-style expandable intelligence sections and news cards
 * Server Component — no useState; uses native <details>/<summary> for expandable
 */

import type { IntelligenceReport } from '@/lib/types/account-plan'
import type { NewsArticle } from '@/lib/types/news'
import { ExternalLink, Radio } from 'lucide-react'

interface IntelligenceTabProps {
  intelligenceReport: { raw: string; structured?: IntelligenceReport } | null
  news: { articles: NewsArticle[] } | null
  customerName: string
}

export function IntelligenceTab({ intelligenceReport, news, customerName }: IntelligenceTabProps) {
  const hasIntelligence = intelligenceReport && intelligenceReport.raw
  const hasNews = news && news.articles.length > 0

  if (!hasIntelligence && !hasNews) {
    return (
      <div className="py-16 text-center text-[var(--muted)]">
        <Radio size={40} className="mx-auto mb-4 opacity-30" />
        <div className="font-display text-2xl mb-2">No intelligence available</div>
        <div className="text-sm">
          Generate an account plan to populate intelligence data for{' '}
          <strong>{customerName}</strong>.
        </div>
      </div>
    )
  }

  // Parse raw markdown into sections for expandable display
  // Sections are delimited by ## headings
  const sections: { title: string; content: string }[] = []

  if (hasIntelligence && intelligenceReport.raw) {
    const raw = intelligenceReport.raw
    const lines = raw.split('\n')
    let currentTitle = 'Overview'
    let currentLines: string[] = []

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentLines.some((l) => l.trim())) {
          sections.push({
            title: currentTitle,
            content: currentLines.join('\n').trim(),
          })
        }
        currentTitle = line.replace(/^##\s+/, '').trim()
        currentLines = []
      } else if (line.startsWith('# ')) {
        // Skip H1 title lines (account name)
        currentTitle = line.replace(/^#\s+/, '').trim()
      } else {
        currentLines.push(line)
      }
    }

    // Push last section
    if (currentLines.some((l) => l.trim())) {
      sections.push({
        title: currentTitle,
        content: currentLines.join('\n').trim(),
      })
    }

    // If no sections found (no ## headings), show the whole text as one section
    if (sections.length === 0 && raw.trim()) {
      sections.push({
        title: 'Intelligence Report',
        content: raw.trim(),
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Expandable Sections */}
      {sections.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Intelligence Report
          </h2>
          <div className="space-y-3">
            {sections.map(({ title, content }, index) => (
              <details
                key={title}
                style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }} className="group"
                open={index === 0}
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--highlight)] transition-colors list-none">
                  <span className="font-semibold text-[var(--secondary)]">{title}</span>
                  <svg
                    className="w-4 h-4 text-[var(--muted)] transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--ink)] leading-relaxed border-t border-[var(--border)] pt-4 whitespace-pre-wrap">
                  {content}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* News & Signals */}
      {hasNews && (
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--secondary)] mb-4 pb-2 border-b-[2px] border-[var(--border)]">
            Recent News & Signals
          </h2>
          <div className="space-y-4">
            {news!.articles.map((article, i) => (
              <div
                key={i}
                style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "1.5rem", position: "relative", overflow: "hidden", transition: "all 0.3s ease" }} className="group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--secondary)] mb-1 leading-snug">
                      {article.title}
                    </div>
                    <div className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                      {article.summary.replace(/<[^>]*>/g, '').slice(0, 200)}
                      {article.summary.length > 200 && '...'}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                      {article.publishedAt && (
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      {article.source && (
                        <>
                          <span>·</span>
                          <span>{article.source}</span>
                        </>
                      )}
                      {article.relevanceScore && article.relevanceScore > 0.7 && (
                        <>
                          <span>·</span>
                          <span className="inline-block px-2 py-0.5 rounded-sm text-xs font-semibold uppercase tracking-wide text-white bg-[var(--accent)]">
                            {article.relevanceScore > 0.85 ? 'high' : 'medium'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
