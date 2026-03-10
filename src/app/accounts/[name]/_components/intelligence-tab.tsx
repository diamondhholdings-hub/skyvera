/**
 * IntelligenceTab — enriched account intelligence with RapidAPI data sections
 *
 * Sections (when enrichment exists):
 *   1. Company Profile
 *   2. Hiring Signals
 *   3. Financial Intelligence (public companies only)
 *   4. Risk Signals
 *   5. Market Perception
 *   6. Latest News (with sentiment badges)
 *   7. Intelligence Report (existing markdown, expandable)
 *
 * When no enrichment exists: "Not yet enriched" state with trigger button.
 *
 * Server component — only the EnrichButton is client-side.
 */

import type { IntelligenceReport } from '@/lib/types/account-plan'
import type { NewsArticle } from '@/lib/types/news'
import type { AccountEnrichment } from '@/lib/types/enrichment'
import { ExternalLink, Radio } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { EnrichButton } from './enrich-button'

// ─── Helper components ────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--secondary)',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '2px solid var(--border)',
      }}
    >
      {children}
    </h2>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        padding: '1.5rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Chip({
  children,
  color,
}: {
  children: React.ReactNode
  color?: 'default' | 'success' | 'warning' | 'critical' | 'accent'
}) {
  const colorMap = {
    default: { background: 'var(--highlight)', color: 'var(--ink)' },
    success: { background: 'rgba(34,197,94,0.12)', color: 'var(--success, #16a34a)' },
    warning: { background: 'rgba(234,179,8,0.15)', color: 'var(--warning, #b45309)' },
    critical: { background: 'rgba(239,68,68,0.12)', color: 'var(--critical, #dc2626)' },
    accent: { background: 'rgba(var(--accent-rgb,59,130,246),0.12)', color: 'var(--accent)' },
  }
  const styles = colorMap[color ?? 'default']
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '3px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        ...styles,
      }}
    >
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.4rem' }}>
      <span
        style={{
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          flexShrink: 0,
          minWidth: '10rem',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.round(rating)
  return (
    <span style={{ display: 'inline-flex', gap: '1px', alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{ color: i < filled ? '#f59e0b' : '#d1d5db', fontSize: '0.9rem' }}
        >
          ★
        </span>
      ))}
      <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
        {rating.toFixed(1)}
      </span>
    </span>
  )
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

// ─── Section: Company Profile ────────────────────────────────────────────────

function CompanyProfileSection({
  profile,
}: {
  profile: NonNullable<AccountEnrichment['companyProfile']>
}) {
  const fundingHealthColor =
    profile.fundingStage === 'Public'
      ? 'accent'
      : profile.lastFundingRound
        ? 'success'
        : 'warning'

  return (
    <section>
      <SectionHeader>Company Profile</SectionHeader>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            {profile.industry && <MetaRow label="Industry" value={profile.industry} />}
            {profile.headquarters && <MetaRow label="Headquarters" value={profile.headquarters} />}
            {profile.foundedYear && (
              <MetaRow label="Founded" value={profile.foundedYear.toString()} />
            )}
            {(profile.employeeCount || profile.employeeRange) && (
              <MetaRow
                label="Employees"
                value={
                  profile.employeeCount
                    ? `${profile.employeeCount.toLocaleString()}${profile.employeeRange ? ` (${profile.employeeRange})` : ''}`
                    : profile.employeeRange
                }
              />
            )}
            {profile.fundingStage && (
              <MetaRow
                label="Funding Stage"
                value={<Chip color={fundingHealthColor}>{profile.fundingStage}</Chip>}
              />
            )}
            {(profile.lastFundingRound || profile.totalFunding) && (
              <MetaRow
                label="Latest Funding"
                value={
                  <span>
                    {profile.lastFundingRound && (
                      <span style={{ marginRight: '0.5rem' }}>{profile.lastFundingRound}</span>
                    )}
                    {profile.totalFunding && (
                      <span style={{ fontWeight: 600 }}>{formatMoney(profile.totalFunding)}</span>
                    )}
                    {profile.lastFundingDate && (
                      <span style={{ color: 'var(--muted)', marginLeft: '0.4rem', fontSize: '0.8rem' }}>
                        {profile.lastFundingDate}
                      </span>
                    )}
                  </span>
                }
              />
            )}
            {profile.stockSymbol && (
              <MetaRow
                label="Stock Symbol"
                value={<Chip color="accent">{profile.stockSymbol}</Chip>}
              />
            )}
          </div>
          <div>
            {profile.description && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                  marginBottom: '1rem',
                }}
              >
                {profile.description}
              </p>
            )}
            {profile.technologies && profile.technologies.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Tech Stack
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {profile.technologies.slice(0, 12).map((tech) => (
                    <Chip key={tech}>{tech}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {profile.sources && profile.sources.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.72rem',
              color: 'var(--muted)',
            }}
          >
            Sources: {profile.sources.join(' · ')}
          </div>
        )}
      </Card>
    </section>
  )
}

// ─── Section: Hiring Signals ─────────────────────────────────────────────────

function HiringSignalsSection({
  signals,
}: {
  signals: NonNullable<AccountEnrichment['hiringSignals']>
}) {
  const velocityColor =
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
    <section>
      <SectionHeader>Hiring Signals</SectionHeader>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <MetaRow
              label="Hiring Velocity"
              value={<Chip color={velocityColor}>{velocityLabel}</Chip>}
            />
            <MetaRow
              label="Open Roles"
              value={
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {signals.totalOpenRoles.toLocaleString()}
                </span>
              }
            />
            <MetaRow
              label="Recent Postings (30d)"
              value={signals.recentPostings30d.toLocaleString()}
            />
            <MetaRow
              label="CS Hiring"
              value={
                signals.csHiring ? (
                  <Chip color="success">Active — Engagement Signal</Chip>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Not detected</span>
                )
              }
            />
            <MetaRow
              label="Tech Hiring"
              value={
                signals.techHiring ? (
                  <Chip color="accent">Active</Chip>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Not detected</span>
                )
              }
            />
            {signals.layoffSignals && (
              <MetaRow
                label="Layoff Signals"
                value={<Chip color="critical">Detected</Chip>}
              />
            )}
            {signals.keyDepartmentsHiring && signals.keyDepartmentsHiring.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Key Departments
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {signals.keyDepartmentsHiring.map((dept) => (
                    <Chip key={dept} color="default">
                      {dept}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            {signals.topRoles && signals.topRoles.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                    marginBottom: '0.6rem',
                  }}
                >
                  Top Open Roles
                </div>
                <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                  {signals.topRoles.slice(0, 5).map((role, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--ink)',
                        marginBottom: '0.4rem',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{role.title}</span>
                      {role.department && (
                        <span style={{ color: 'var(--muted)', marginLeft: '0.3rem' }}>
                          · {role.department}
                        </span>
                      )}
                      {role.location && (
                        <span style={{ color: 'var(--muted)', marginLeft: '0.3rem', fontSize: '0.8rem' }}>
                          — {role.location}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}

// ─── Section: Financial Intelligence ────────────────────────────────────────

function FinancialsSection({
  financials,
}: {
  financials: NonNullable<AccountEnrichment['financials']>
}) {
  if (!financials.isPublic) return null

  const earningsBeat = financials.latestEarnings?.revenueSurprise != null
    ? financials.latestEarnings.revenueSurprise >= 0
    : null

  const ratingColor =
    financials.analystRating === 'Strong Buy' || financials.analystRating === 'Buy'
      ? 'success'
      : financials.analystRating === 'Sell' || financials.analystRating === 'Strong Sell'
        ? 'critical'
        : 'warning'

  return (
    <section>
      <SectionHeader>Financial Intelligence</SectionHeader>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            {financials.marketCap && (
              <MetaRow label="Market Cap" value={<strong>{formatMoney(financials.marketCap)}</strong>} />
            )}
            {financials.revenue?.annual && (
              <MetaRow label="Annual Revenue" value={formatMoney(financials.revenue.annual)} />
            )}
            {financials.revenue?.quarterly && (
              <MetaRow label="Quarterly Revenue" value={formatMoney(financials.revenue.quarterly)} />
            )}
            {financials.revenueGrowth != null && (
              <MetaRow
                label="Revenue Growth (YoY)"
                value={
                  <Chip color={financials.revenueGrowth >= 0 ? 'success' : 'critical'}>
                    {financials.revenueGrowth >= 0 ? '+' : ''}
                    {(financials.revenueGrowth * 100).toFixed(1)}%
                  </Chip>
                }
              />
            )}
            {financials.profitMargin != null && (
              <MetaRow
                label="Profit Margin"
                value={`${(financials.profitMargin * 100).toFixed(1)}%`}
              />
            )}
            {financials.analystRating && (
              <MetaRow
                label="Analyst Rating"
                value={<Chip color={ratingColor}>{financials.analystRating}</Chip>}
              />
            )}
            {financials.latestEarnings && (
              <MetaRow
                label="Latest Earnings"
                value={
                  <span>
                    {financials.latestEarnings.quarter}
                    {earningsBeat !== null && (
                      <Chip color={earningsBeat ? 'success' : 'critical'} >
                        {earningsBeat ? ' Beat' : ' Miss'}
                      </Chip>
                    )}
                  </span>
                }
              />
            )}
          </div>
          <div>
            {financials.secFilings && financials.secFilings.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                    marginBottom: '0.6rem',
                  }}
                >
                  SEC Filings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {financials.secFilings.slice(0, 5).map((filing, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      <Chip color="default">{filing.type}</Chip>
                      <span style={{ color: 'var(--muted)' }}>{filing.date}</span>
                      {filing.url ? (
                        <a
                          href={filing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                        >
                          {filing.description || 'View'}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--ink)' }}>{filing.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
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

  const fundingColor =
    fundingSignal === 'healthy' ? 'success' : fundingSignal === 'risk' ? 'critical' : 'warning'

  const trafficColor =
    webTrend === 'growing' ? 'success' : webTrend === 'declining' ? 'critical' : 'default'

  return (
    <section>
      <SectionHeader>Risk Signals</SectionHeader>

      {bankruptcyFlag && (
        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '2px solid var(--critical, #dc2626)',
            padding: '1rem 1.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--critical, #dc2626)', fontSize: '0.9rem' }}>
              Bankruptcy Filing Detected
            </div>
            {riskProfile?.bankruptcyRisk.details && (
              <div style={{ fontSize: '0.8rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                {riskProfile.bankruptcyRisk.details}
                {riskProfile.bankruptcyRisk.filingDate &&
                  ` · Filed ${riskProfile.bankruptcyRisk.filingDate}`}
                {riskProfile.bankruptcyRisk.chapter &&
                  ` · Chapter ${riskProfile.bankruptcyRisk.chapter}`}
              </div>
            )}
          </div>
        </div>
      )}

      {recentBreach && (
        <div
          style={{
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid var(--warning, #b45309)',
            padding: '0.75rem 1.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: 'var(--ink)',
          }}
        >
          <strong>Cyber Incident Alert:</strong> Recent security breach detected in the last 12
          months.
          {riskProfile?.cyberIncidents.lastIncidentDate &&
            ` Last incident: ${riskProfile.cyberIncidents.lastIncidentDate}`}
        </div>
      )}

      <Card>
        <MetaRow
          label="Funding Health"
          value={
            <Chip color={fundingColor}>
              {fundingSignal.charAt(0).toUpperCase() + fundingSignal.slice(1)}
            </Chip>
          }
        />
        {riskProfile?.fundingHealth.lastRoundDate && (
          <MetaRow
            label="Last Round"
            value={
              <span>
                {riskProfile.fundingHealth.lastRoundType &&
                  `${riskProfile.fundingHealth.lastRoundType} · `}
                {riskProfile.fundingHealth.lastRoundAmount &&
                  `${formatMoney(riskProfile.fundingHealth.lastRoundAmount)} · `}
                {riskProfile.fundingHealth.lastRoundDate}
                {riskProfile.fundingHealth.monthsSinceLastRound != null && (
                  <span style={{ color: 'var(--muted)', marginLeft: '0.3rem' }}>
                    ({riskProfile.fundingHealth.monthsSinceLastRound} months ago)
                  </span>
                )}
              </span>
            }
          />
        )}
        <MetaRow
          label="Web Traffic Trend"
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Chip color={trafficColor}>
                {webTrend.charAt(0).toUpperCase() + webTrend.slice(1)}
              </Chip>
              {riskProfile?.webPresence.monthlyVisits && (
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {riskProfile.webPresence.monthlyVisits.toLocaleString()} monthly visits
                </span>
              )}
            </span>
          }
        />
      </Card>
    </section>
  )
}

// ─── Section: Market Perception ──────────────────────────────────────────────

function MarketPerceptionSection({
  riskProfile,
}: {
  riskProfile: NonNullable<AccountEnrichment['riskCompetitive']>
}) {
  const mp = riskProfile.marketPerception
  const sentimentColor =
    mp.overallSentiment === 'positive'
      ? 'success'
      : mp.overallSentiment === 'negative'
        ? 'critical'
        : 'default'

  const hasRatings = mp.g2Rating || mp.glassdoorRating || mp.trustpilotRating

  return (
    <section>
      <SectionHeader>Market Perception</SectionHeader>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <MetaRow
              label="Overall Sentiment"
              value={
                <Chip color={sentimentColor}>
                  {mp.overallSentiment.charAt(0).toUpperCase() + mp.overallSentiment.slice(1)}
                </Chip>
              }
            />
            {hasRatings && (
              <>
                {mp.g2Rating && (
                  <MetaRow
                    label="G2 Rating"
                    value={
                      <span>
                        <StarRating rating={mp.g2Rating} />
                        {mp.g2ReviewCount && (
                          <span style={{ color: 'var(--muted)', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                            ({mp.g2ReviewCount} reviews)
                          </span>
                        )}
                      </span>
                    }
                  />
                )}
                {mp.glassdoorRating && (
                  <MetaRow label="Glassdoor" value={<StarRating rating={mp.glassdoorRating} />} />
                )}
                {mp.trustpilotRating && (
                  <MetaRow
                    label="Trustpilot"
                    value={<StarRating rating={mp.trustpilotRating} />}
                  />
                )}
              </>
            )}
          </div>
          <div>
            {riskProfile.competitorLandscape.primaryCompetitors.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Key Competitors
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {riskProfile.competitorLandscape.primaryCompetitors.map((c) => (
                    <Chip key={c} color="default">
                      {c}
                    </Chip>
                  ))}
                </div>
                {riskProfile.competitorLandscape.marketPosition && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Market Position: <strong style={{ color: 'var(--ink)' }}>{riskProfile.competitorLandscape.marketPosition}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}

// ─── Section: Latest News (with sentiment badges) ────────────────────────────

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

function NewsSection({ articles }: { articles: AnyArticle[] }) {
  // Normalise: adapter articles have { sentiment, sentimentScore }; legacy have { sentiment? }
  return (
    <section>
      <SectionHeader>Latest News & Signals</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {articles.map((article, i) => {
          const sentiment = article.sentiment ?? 'neutral'
          const sentimentDot =
            sentiment === 'positive'
              ? '#16a34a'
              : sentiment === 'negative'
                ? '#dc2626'
                : '#9ca3af'

          const title = article.title ?? ''
          const summary = article.summary ?? ''
          const url = article.url
          const source = article.source
          const publishedAt = article.publishedAt ? String(article.publishedAt) : undefined
          const relevanceScore = article.relevanceScore

          return (
            <Card key={i} style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Sentiment indicator dot */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: sentimentDot,
                    flexShrink: 0,
                    marginTop: '0.35rem',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--secondary)', lineHeight: 1.3 }}
                  >
                    {title}
                  </div>
                  <div
                    style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}
                  >
                    {summary.replace(/<[^>]*>/g, '').slice(0, 200)}
                    {summary.length > 200 && '...'}
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
                  >
                    {publishedAt && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {new Date(publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {source && (
                      <>
                        <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>·</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{source}</span>
                      </>
                    )}
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: sentimentDot,
                      }}
                    >
                      {sentiment}
                    </span>
                    {relevanceScore && relevanceScore > 0.7 && (
                      <Chip color="accent">
                        {relevanceScore > 0.85 ? 'High Relevance' : 'Medium Relevance'}
                      </Chip>
                    )}
                  </div>
                </div>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flexShrink: 0, color: 'var(--muted)' }}
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

// ─── Intelligence Report (existing markdown, expandable) ─────────────────────

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
    sections.push({ title: 'Intelligence Report', content: raw.trim() })
  }

  if (sections.length === 0) return null

  return (
    <section>
      <SectionHeader>Intelligence Report</SectionHeader>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sections.map(({ title, content }, index) => (
          <details
            key={title}
            style={{
              background: 'white',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
            className="group"
            open={index === 0}
          >
            <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--highlight)] transition-colors list-none">
              <span className="font-semibold" style={{ color: 'var(--secondary)' }}>
                {title}
              </span>
              <svg
                className="group-open:rotate-180"
                style={{
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                  color: 'var(--muted)',
                  transition: 'transform 0.2s',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-5 border-t border-[var(--border)] pt-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[var(--secondary)] text-white">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="p-2 text-left text-xs uppercase tracking-widest font-semibold">
                      {children}
                    </th>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-[var(--border)] hover:bg-[var(--highlight)] transition-colors">
                      {children}
                    </tr>
                  ),
                  td: ({ children }) => (
                    <td className="p-2 text-sm text-[var(--ink)]">{children}</td>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-[var(--ink)] leading-relaxed mb-3 last:mb-0">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold" style={{ color: 'var(--secondary)' }}>
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-[var(--muted)]">{children}</em>
                  ),
                  h3: ({ children }) => (
                    <h3
                      className="font-semibold text-sm mt-4 mb-1"
                      style={{ color: 'var(--secondary)' }}
                    >
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="font-semibold text-xs uppercase tracking-wide mt-3 mb-1" style={{ color: 'var(--muted)' }}>
                      {children}
                    </h4>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--ink)] mb-3">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--ink)] mb-3">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  hr: () => <hr className="my-4 border-[var(--border)]" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-[var(--accent)] pl-4 text-sm text-[var(--muted)] italic my-3">
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
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>
        <Radio size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
        <div
          style={{
            fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            color: 'var(--secondary)',
          }}
        >
          No intelligence available
        </div>
        <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Enrich this account to unlock company profile, hiring signals, financial data, and risk
          analysis for <strong>{customerName}</strong>.
        </div>
        <EnrichButton customerName={customerName} />
      </div>
    )
  }

  // Not yet enriched — show partial state with enrich prompt
  const showEnrichPrompt = !hasEnrichment

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Enrich prompt (when no enrichment but markdown/legacy news exists) */}
      {showEnrichPrompt && (
        <div
          style={{
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.2)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.9rem' }}>
              Not yet enriched
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              Run enrichment to add company profile, hiring signals, financial intelligence, and
              risk data.
            </div>
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

      {/* Existing markdown intelligence report (expandable) */}
      {hasMarkdownReport && (
        <IntelligenceReportSection intelligenceReport={intelligenceReport!} />
      )}
    </div>
  )
}
