/**
 * IntelligenceTab — account research from enrichment data sources
 *
 * Sections (when enrichment exists):
 *   1. Company profile
 *   2. Hiring signals
 *   3. Public financials (public companies only)
 *   4. Risk signals
 *   5. Market perception
 *   6. Recent news (with sentiment)
 *   7. Research report (existing markdown, expandable)
 *
 * When no enrichment exists: "Not yet enriched" state with trigger button.
 *
 * Server component — only the EnrichButton is client-side.
 */

import type { IntelligenceReport } from '@/lib/types/account-plan'
import type { NewsArticle } from '@/lib/types/news'
import type { AccountEnrichment } from '@/lib/types/enrichment'
import { ChevronDown, CircleAlert, ExternalLink, FileSearch, RefreshCw, TriangleAlert } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { EnrichButton } from './enrich-button'
import { ReEnrichButton } from '@/components/ui/re-enrich-button'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO enrichedAt string as "March 7, 2026 (3 days ago)". */
function formatEnrichedAt(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return iso
  const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const diffDays = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return `${formatted} (today)`
  if (diffDays === 1) return `${formatted} (1 day ago)`
  if (diffDays < 0) return formatted
  return `${formatted} (${diffDays} days ago)`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Helper components ────────────────────────────────────────────────────────

type Tone = 'default' | 'success' | 'warning' | 'critical'

const badgeVariant: Record<Tone, 'default' | 'success' | 'warning' | 'danger'> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
}

/** A bordered panel with an h2 title row. */
function Panel({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden" aria-labelledby={id}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 id={id} className="m-0">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Chip({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) {
  return <Badge variant={badgeVariant[tone]}>{children}</Badge>
}

/** Small sentence-case field label */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label m-0 mb-1.5">{children}</p>
}

function MetaList({ children }: { children: React.ReactNode }) {
  return <dl className="m-0 text-sm">{children}</dl>
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <dt className="shrink-0 sm:w-44" style={{ color: 'var(--muted)' }}>{label}</dt>
      <dd className="m-0 min-w-0">{value}</dd>
    </div>
  )
}

function Rating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="num" aria-label={`${rating.toFixed(1)} out of ${max}`}>
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span style={{ color: 'var(--muted)' }}> / {max}</span>
    </span>
  )
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

function NotDetected() {
  return <span style={{ color: 'var(--muted)' }}>Not detected</span>
}

// ─── Section: Company Profile ────────────────────────────────────────────────

function CompanyProfileSection({
  profile,
}: {
  profile: NonNullable<AccountEnrichment['companyProfile']>
}) {
  const fundingHealthColor: Tone =
    profile.fundingStage === 'Public'
      ? 'default'
      : profile.lastFundingRound
        ? 'success'
        : 'warning'

  const hasDetails = !!(
    profile.industry || profile.headquarters || profile.foundedYear || profile.employeeCount ||
    profile.employeeRange || profile.fundingStage || profile.lastFundingRound || profile.totalFunding ||
    profile.stockSymbol || profile.description || profile.technologies?.length
  )

  return (
    <Panel title="Company profile" id="intel-profile">
      {!hasDetails && (
        <p className="m-0 text-sm" style={{ color: 'var(--muted)' }}>No profile details returned by the data sources yet.</p>
      )}
      {hasDetails && <div className="grid gap-6 lg:grid-cols-2">
        <MetaList>
          {profile.industry && <MetaRow label="Industry" value={profile.industry} />}
          {profile.headquarters && <MetaRow label="Headquarters" value={profile.headquarters} />}
          {profile.foundedYear && (
            <MetaRow label="Founded" value={<span className="num">{profile.foundedYear}</span>} />
          )}
          {(profile.employeeCount || profile.employeeRange) && (
            <MetaRow
              label="Employees"
              value={
                <span className="num">
                  {profile.employeeCount
                    ? `${profile.employeeCount.toLocaleString()}${profile.employeeRange ? ` (${profile.employeeRange})` : ''}`
                    : profile.employeeRange}
                </span>
              }
            />
          )}
          {profile.fundingStage && (
            <MetaRow
              label="Funding stage"
              value={<Chip tone={fundingHealthColor}>{profile.fundingStage}</Chip>}
            />
          )}
          {(profile.lastFundingRound || profile.totalFunding) && (
            <MetaRow
              label="Latest funding"
              value={
                <span>
                  {profile.lastFundingRound && <span className="mr-2">{profile.lastFundingRound}</span>}
                  {profile.totalFunding && <span className="num font-medium">{formatMoney(profile.totalFunding)}</span>}
                  {profile.lastFundingDate && (
                    <span className="num ml-1.5 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
                      {profile.lastFundingDate}
                    </span>
                  )}
                </span>
              }
            />
          )}
          {profile.stockSymbol && (
            <MetaRow label="Stock symbol" value={<span className="font-medium">{profile.stockSymbol}</span>} />
          )}
        </MetaList>
        <div>
          {profile.description && (
            <p className="m-0 mb-4 text-sm" style={{ color: 'var(--ink-2)' }}>
              {profile.description}
            </p>
          )}
          {profile.technologies && profile.technologies.length > 0 && (
            <div>
              <FieldLabel>Tech stack</FieldLabel>
              <p className="m-0 text-sm">{profile.technologies.slice(0, 12).join(', ')}</p>
            </div>
          )}
        </div>
      </div>}
      {profile.sources && profile.sources.length > 0 && (
        <p className="m-0 mt-4 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
          Sources: {profile.sources.join(' · ')}
        </p>
      )}
    </Panel>
  )
}

// ─── Section: Hiring Signals ─────────────────────────────────────────────────

function HiringSignalsSection({
  signals,
}: {
  signals: NonNullable<AccountEnrichment['hiringSignals']>
}) {
  const velocityColor: Tone =
    signals.hiringVelocityTrend === 'growing'
      ? 'success'
      : signals.hiringVelocityTrend === 'declining'
        ? 'critical'
        : 'default'

  const velocityLabel =
    signals.hiringVelocityTrend === 'growing'
      ? 'Growing'
      : signals.hiringVelocityTrend === 'declining'
        ? 'Declining'
        : signals.hiringVelocityTrend === 'stable'
          ? 'Stable'
          : 'Unknown'

  return (
    <Panel title="Hiring signals" id="intel-hiring">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <MetaList>
            <MetaRow label="Hiring velocity" value={<Chip tone={velocityColor}>{velocityLabel}</Chip>} />
            <MetaRow
              label="Open roles"
              value={<span className="num font-semibold">{signals.totalOpenRoles.toLocaleString()}</span>}
            />
            <MetaRow
              label="Recent postings (30 days)"
              value={<span className="num">{signals.recentPostings30d.toLocaleString()}</span>}
            />
            <MetaRow
              label="CS hiring"
              value={signals.csHiring ? <Chip tone="success">Active, engagement signal</Chip> : <NotDetected />}
            />
            <MetaRow
              label="Tech hiring"
              value={signals.techHiring ? <Chip>Active</Chip> : <NotDetected />}
            />
            {signals.layoffSignals && (
              <MetaRow label="Layoff signals" value={<Chip tone="critical">Detected</Chip>} />
            )}
          </MetaList>
          {signals.keyDepartmentsHiring && signals.keyDepartmentsHiring.length > 0 && (
            <div className="mt-4">
              <FieldLabel>Key departments</FieldLabel>
              <p className="m-0 text-sm">{signals.keyDepartmentsHiring.join(', ')}</p>
            </div>
          )}
        </div>
        <div>
          {signals.topRoles && signals.topRoles.length > 0 && (
            <div>
              <FieldLabel>Top open roles</FieldLabel>
              <ul className="m-0 list-none p-0 text-sm">
                {signals.topRoles.slice(0, 5).map((role, i) => (
                  <li key={i} className="py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-medium">{role.title}</span>
                    {(role.department || role.location) && (
                      <span className="block text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
                        {[role.department, role.location].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

// ─── Section: Public financials ──────────────────────────────────────────────

function FinancialsSection({
  financials,
}: {
  financials: NonNullable<AccountEnrichment['financials']>
}) {
  if (!financials.isPublic) return null

  const earningsBeat = financials.latestEarnings?.revenueSurprise != null
    ? financials.latestEarnings.revenueSurprise >= 0
    : null

  const ratingColor: Tone =
    financials.analystRating === 'Strong Buy' || financials.analystRating === 'Buy'
      ? 'success'
      : financials.analystRating === 'Sell' || financials.analystRating === 'Strong Sell'
        ? 'critical'
        : 'warning'

  return (
    <Panel title="Public financials" id="intel-financials">
      <div className="grid gap-6 lg:grid-cols-2">
        <MetaList>
          {financials.marketCap && (
            <MetaRow label="Market cap" value={<span className="num font-semibold">{formatMoney(financials.marketCap)}</span>} />
          )}
          {financials.revenue?.annual && (
            <MetaRow label="Annual revenue" value={<span className="num">{formatMoney(financials.revenue.annual)}</span>} />
          )}
          {financials.revenue?.quarterly && (
            <MetaRow label="Quarterly revenue" value={<span className="num">{formatMoney(financials.revenue.quarterly)}</span>} />
          )}
          {financials.revenueGrowth != null && (
            <MetaRow
              label="Revenue growth (YoY)"
              value={
                <span className="num font-medium" style={{ color: financials.revenueGrowth >= 0 ? 'var(--success-ink)' : 'var(--critical-ink)' }}>
                  {financials.revenueGrowth >= 0 ? '+' : ''}
                  {(financials.revenueGrowth * 100).toFixed(1)}%
                </span>
              }
            />
          )}
          {financials.profitMargin != null && (
            <MetaRow
              label="Profit margin"
              value={<span className="num">{(financials.profitMargin * 100).toFixed(1)}%</span>}
            />
          )}
          {financials.analystRating && (
            <MetaRow label="Analyst rating" value={<Chip tone={ratingColor}>{financials.analystRating}</Chip>} />
          )}
          {financials.latestEarnings && (
            <MetaRow
              label="Latest earnings"
              value={
                <span className="inline-flex items-center gap-2">
                  {financials.latestEarnings.quarter}
                  {earningsBeat !== null && (
                    <Chip tone={earningsBeat ? 'success' : 'critical'}>{earningsBeat ? 'Beat' : 'Miss'}</Chip>
                  )}
                </span>
              }
            />
          )}
        </MetaList>
        <div>
          {financials.secFilings && financials.secFilings.length > 0 && (
            <div>
              <FieldLabel>SEC filings</FieldLabel>
              <ul className="m-0 list-none p-0 text-[0.8125rem]">
                {financials.secFilings.slice(0, 5).map((filing, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-2 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="font-medium">{filing.type}</span>
                    <span className="num" style={{ color: 'var(--muted)' }}>{filing.date}</span>
                    {filing.url ? (
                      <a
                        href={filing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                        style={{ color: 'var(--secondary)' }}
                      >
                        {filing.description || 'View'}
                      </a>
                    ) : (
                      <span>{filing.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

// ─── Section: Risk Signals ───────────────────────────────────────────────────

function RiskSignalsSection({
  riskProfile,
}: {
  riskProfile: AccountEnrichment['riskCompetitive']
}) {
  // This section always renders — use defaults when no enrichment
  const bankruptcyFlag = riskProfile?.bankruptcyRisk.flag ?? false
  const fundingSignal = riskProfile?.fundingHealth.signal ?? 'unknown'
  const webTrend = riskProfile?.webPresence.visitsTrend ?? 'unknown'
  const recentBreach = riskProfile?.cyberIncidents.recentBreach ?? false

  const fundingColor: Tone =
    fundingSignal === 'healthy' ? 'success' : fundingSignal === 'risk' ? 'critical' : 'warning'

  const trafficColor: Tone =
    webTrend === 'growing' ? 'success' : webTrend === 'declining' ? 'critical' : 'default'

  return (
    <Panel title="Risk signals" id="intel-risk">
      {bankruptcyFlag && (
        <div className="alert-box alert-critical mt-0 flex items-start gap-3" role="alert">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="m-0 text-sm font-semibold">Bankruptcy filing detected</p>
            {riskProfile?.bankruptcyRisk.details && (
              <p className="m-0 mt-1 text-[0.8125rem]">
                {riskProfile.bankruptcyRisk.details}
                {riskProfile.bankruptcyRisk.filingDate &&
                  ` · Filed ${riskProfile.bankruptcyRisk.filingDate}`}
                {riskProfile.bankruptcyRisk.chapter &&
                  ` · Chapter ${riskProfile.bankruptcyRisk.chapter}`}
              </p>
            )}
          </div>
        </div>
      )}

      {recentBreach && (
        <div className="alert-box alert-warning mt-0 flex items-start gap-3 text-sm" role="status">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="m-0">
            <span className="font-semibold">Cyber incident alert:</span> recent security breach detected in the last 12
            months.
            {riskProfile?.cyberIncidents.lastIncidentDate &&
              ` Last incident: ${riskProfile.cyberIncidents.lastIncidentDate}`}
          </p>
        </div>
      )}

      <MetaList>
        <MetaRow label="Funding health" value={<Chip tone={fundingColor}>{capitalize(fundingSignal)}</Chip>} />
        {riskProfile?.fundingHealth.lastRoundDate && (
          <MetaRow
            label="Last round"
            value={
              <span>
                {riskProfile.fundingHealth.lastRoundType &&
                  `${riskProfile.fundingHealth.lastRoundType} · `}
                {riskProfile.fundingHealth.lastRoundAmount &&
                  `${formatMoney(riskProfile.fundingHealth.lastRoundAmount)} · `}
                {riskProfile.fundingHealth.lastRoundDate}
                {riskProfile.fundingHealth.monthsSinceLastRound != null && (
                  <span className="ml-1" style={{ color: 'var(--muted)' }}>
                    ({riskProfile.fundingHealth.monthsSinceLastRound} months ago)
                  </span>
                )}
              </span>
            }
          />
        )}
        <MetaRow
          label="Web traffic trend"
          value={
            <span className="inline-flex flex-wrap items-center gap-2">
              <Chip tone={trafficColor}>{capitalize(webTrend)}</Chip>
              {riskProfile?.webPresence.monthlyVisits && (
                <span className="num text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
                  {riskProfile.webPresence.monthlyVisits.toLocaleString()} monthly visits
                </span>
              )}
            </span>
          }
        />
      </MetaList>
    </Panel>
  )
}

// ─── Section: Market Perception ──────────────────────────────────────────────

function MarketPerceptionSection({
  riskProfile,
}: {
  riskProfile: NonNullable<AccountEnrichment['riskCompetitive']>
}) {
  const mp = riskProfile.marketPerception
  const sentimentColor: Tone =
    mp.overallSentiment === 'positive'
      ? 'success'
      : mp.overallSentiment === 'negative'
        ? 'critical'
        : 'default'

  const hasRatings = mp.g2Rating || mp.glassdoorRating || mp.trustpilotRating

  return (
    <Panel title="Market perception" id="intel-market">
      <div className="grid gap-6 lg:grid-cols-2">
        <MetaList>
          <MetaRow
            label="Overall sentiment"
            value={<Chip tone={sentimentColor}>{capitalize(mp.overallSentiment)}</Chip>}
          />
          {hasRatings && (
            <>
              {mp.g2Rating && (
                <MetaRow
                  label="G2 rating"
                  value={
                    <span>
                      <Rating rating={mp.g2Rating} />
                      {mp.g2ReviewCount && (
                        <span className="num ml-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                          ({mp.g2ReviewCount} reviews)
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              {mp.glassdoorRating && <MetaRow label="Glassdoor" value={<Rating rating={mp.glassdoorRating} />} />}
              {mp.trustpilotRating && <MetaRow label="Trustpilot" value={<Rating rating={mp.trustpilotRating} />} />}
            </>
          )}
        </MetaList>
        <div>
          {riskProfile.competitorLandscape.primaryCompetitors.length > 0 && (
            <div>
              <FieldLabel>Key competitors</FieldLabel>
              <p className="m-0 text-sm">{riskProfile.competitorLandscape.primaryCompetitors.join(', ')}</p>
              {riskProfile.competitorLandscape.marketPosition && (
                <p className="m-0 mt-3 text-[0.8125rem]" style={{ color: 'var(--muted)' }}>
                  Market position: <span className="font-medium" style={{ color: 'var(--ink)' }}>{riskProfile.competitorLandscape.marketPosition}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

// ─── Section: Recent news (with sentiment) ───────────────────────────────────

// Unified article shape that covers both enriched SentimentNewsArticle and legacy NewsArticle
type AnyArticle = {
  title: string
  summary?: string
  url?: string
  source?: string
  publishedAt?: string | Date
  sentiment?: string
  sentimentScore?: number
  relevanceScore?: number
}

const sentimentTone: Record<string, Tone> = {
  positive: 'success',
  negative: 'critical',
}

function NewsSection({ articles }: { articles: AnyArticle[] }) {
  // Normalise: adapter articles have { sentiment, sentimentScore }; legacy have { sentiment? }
  return (
    <section className="card overflow-hidden" aria-labelledby="intel-news">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 id="intel-news" className="m-0">Recent news</h2>
      </div>
      <ul className="m-0 list-none p-0">
        {articles.map((article, i) => {
          const sentiment = article.sentiment ?? 'neutral'
          const title = article.title ?? ''
          const summary = article.summary ?? ''
          const url = article.url
          const source = article.source
          const publishedAt = article.publishedAt ? String(article.publishedAt) : undefined
          const relevanceScore = article.relevanceScore

          return (
            <li key={i} className="flex items-start gap-4 px-5 py-4" style={{ borderTop: i ? '1px solid var(--border)' : undefined }}>
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-sm">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="intel-news-link">
                      {title}
                    </a>
                  ) : title}
                </h3>
                {summary && (
                  <p className="m-0 mt-1 text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>
                    {summary.replace(/<[^>]*>/g, '').slice(0, 200)}
                    {summary.length > 200 && '...'}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {publishedAt && (
                    <span className="num">
                      {new Date(publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {source && <><span aria-hidden="true">·</span><span>{source}</span></>}
                  <Chip tone={sentimentTone[sentiment] ?? 'default'}>{capitalize(sentiment)}</Chip>
                  {relevanceScore && relevanceScore > 0.7 && (
                    <Chip>{relevanceScore > 0.85 ? 'High relevance' : 'Medium relevance'}</Chip>
                  )}
                </div>
              </div>
              {url && (
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ─── Research report (existing markdown, expandable) ─────────────────────────

function IntelligenceReportSection({
  intelligenceReport,
}: {
  intelligenceReport: { raw: string }
}) {
  const sections: { title: string; content: string }[] = []
  const raw = intelligenceReport.raw
  const lines = raw.split('\n')
  let currentTitle = 'Overview'
  let currentLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLines.some((l) => l.trim())) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() })
      }
      currentTitle = line.replace(/^##\s+/, '').trim()
      currentLines = []
    } else if (line.startsWith('# ')) {
      currentTitle = line.replace(/^#\s+/, '').trim()
    } else {
      currentLines.push(line)
    }
  }
  if (currentLines.some((l) => l.trim())) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() })
  }
  if (sections.length === 0 && raw.trim()) {
    sections.push({ title: 'Research report', content: raw.trim() })
  }

  if (sections.length === 0) return null

  return (
    <section aria-labelledby="intel-report">
      <h2 id="intel-report" className="m-0 mb-3">Research report</h2>
      <div className="card overflow-hidden">
        {sections.map(({ title, content }, index) => (
          <details
            key={title}
            className="intel-report-section group"
            open={index === 0}
          >
            <summary className="intel-report-summary flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5">
              <span className="text-sm font-semibold">{title}</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-180"
                style={{ color: 'var(--muted)' }}
                aria-hidden="true"
              />
            </summary>
            <div className="px-5 pb-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="mb-4 overflow-x-auto" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <table className="data-table text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead>{children}</thead>,
                  th: ({ children }) => <th>{children}</th>,
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => <tr>{children}</tr>,
                  td: ({ children }) => <td className="text-sm">{children}</td>,
                  p: ({ children }) => (
                    <p className="mb-3 text-sm leading-relaxed last:mb-0" style={{ color: 'var(--ink)' }}>
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em style={{ color: 'var(--ink-2)' }}>{children}</em>,
                  h3: ({ children }) => <h3 className="mb-1 mt-4 text-sm">{children}</h3>,
                  h4: ({ children }) => <h4 className="mb-1 mt-3 text-[0.8125rem]" style={{ color: 'var(--ink-2)' }}>{children}</h4>,
                  ul: ({ children }) => (
                    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm" style={{ color: 'var(--ink)' }}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm" style={{ color: 'var(--ink)' }}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  hr: () => <hr className="my-4" style={{ borderColor: 'var(--border)' }} />,
                  blockquote: ({ children }) => (
                    <blockquote
                      className="my-3 px-4 py-3 text-sm"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--ink-2)' }}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface IntelligenceTabProps {
  intelligenceReport: { raw: string; structured?: IntelligenceReport } | null
  news: { articles: NewsArticle[] } | null
  customerName: string
  enrichment: AccountEnrichment | null
}

export function IntelligenceTab({
  intelligenceReport,
  news,
  customerName,
  enrichment,
}: IntelligenceTabProps) {
  const hasMarkdownReport = !!(intelligenceReport?.raw)
  const hasLegacyNews = !!(news?.articles.length)
  const hasEnrichment = !!enrichment

  // Decide which news to show: prefer enrichment recentNews, fall back to legacy
  const enrichedNews = enrichment?.recentNews
  const legacyArticles = news?.articles

  // Empty state
  if (!hasEnrichment && !hasMarkdownReport && !hasLegacyNews) {
    return (
      <div
        className="flex flex-col items-start gap-2 p-6"
        style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)' }}
      >
        <FileSearch className="h-5 w-5" style={{ color: 'var(--muted)' }} aria-hidden="true" />
        <h2 className="m-0 text-sm font-semibold">No research for this account yet</h2>
        <p className="m-0 max-w-prose text-sm" style={{ color: 'var(--muted)' }}>
          Enrich {customerName} to add its company profile, hiring signals, public financials and risk signals.
        </p>
        <div className="pt-1">
          <EnrichButton customerName={customerName} />
        </div>
      </div>
    )
  }

  // Not yet enriched — show partial state with enrich prompt
  const showEnrichPrompt = !hasEnrichment

  return (
    <div className="space-y-6">
      {/* Last enriched banner (when enrichment data exists) */}
      {hasEnrichment && enrichment?.enrichedAt && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-[0.8125rem]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--muted)' }}
        >
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Last enriched <span className="font-medium" style={{ color: 'var(--ink)' }}>{formatEnrichedAt(enrichment.enrichedAt)}</span>
          </span>
          <ReEnrichButton customerName={customerName} />
        </div>
      )}

      {/* Enrich prompt (when no enrichment but markdown/legacy news exists) */}
      {showEnrichPrompt && (
        <div className="alert-box alert-info m-0 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-sm font-semibold">Not yet enriched</p>
            <p className="m-0 mt-0.5 text-[0.8125rem]">
              Run enrichment to add company profile, hiring signals, public financials and risk data.
            </p>
          </div>
          <EnrichButton customerName={customerName} />
        </div>
      )}

      {/* Enrichment sections */}
      {enrichment?.companyProfile && (
        <CompanyProfileSection profile={enrichment.companyProfile} />
      )}

      {enrichment?.hiringSignals && (
        <HiringSignalsSection signals={enrichment.hiringSignals} />
      )}

      {enrichment?.financials?.isPublic && (
        <FinancialsSection financials={enrichment.financials} />
      )}

      {/* Risk signals — always shown if enrichment exists, uses defaults otherwise */}
      {hasEnrichment && (
        <RiskSignalsSection riskProfile={enrichment?.riskCompetitive} />
      )}

      {/* Market perception — only when enrichment has riskCompetitive */}
      {enrichment?.riskCompetitive && (
        <MarketPerceptionSection riskProfile={enrichment.riskCompetitive} />
      )}

      {/* News — prefer enriched news with sentiment, fall back to legacy */}
      {(enrichedNews?.length || hasLegacyNews) && (
        <NewsSection articles={(enrichedNews?.length ? enrichedNews : legacyArticles) as AnyArticle[]} />
      )}

      {/* Existing markdown research report (expandable) */}
      {hasMarkdownReport && (
        <IntelligenceReportSection intelligenceReport={intelligenceReport!} />
      )}

      <style>{`
        .intel-report-section + .intel-report-section { border-top: 1px solid var(--border); }
        .intel-report-summary { transition: background-color 150ms var(--ease-out); }
        .intel-report-summary::-webkit-details-marker { display: none; }
        .intel-report-summary:hover { background: var(--highlight); }
        .intel-report-summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .intel-news-link { color: var(--ink); text-decoration: none; }
        .intel-news-link:hover { color: var(--secondary); text-decoration: underline; text-underline-offset: 2px; }
      `}</style>
    </div>
  )
}
