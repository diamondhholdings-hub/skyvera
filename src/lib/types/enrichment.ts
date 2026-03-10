export type { CompanyProfile } from '@/lib/data/adapters/rapidapi/enrichment'
export type { SentimentNewsArticle } from '@/lib/data/adapters/rapidapi/news-sentiment'
export type { PublicCompanyFinancials } from '@/lib/data/adapters/rapidapi/financial-intel'
export type { HiringSignal } from '@/lib/data/adapters/rapidapi/hiring-signals'
export type { RiskCompetitiveProfile } from '@/lib/data/adapters/rapidapi/risk-competitive'

import type { CompanyProfile } from '@/lib/data/adapters/rapidapi/enrichment'
import type { SentimentNewsArticle } from '@/lib/data/adapters/rapidapi/news-sentiment'
import type { PublicCompanyFinancials } from '@/lib/data/adapters/rapidapi/financial-intel'
import type { HiringSignal } from '@/lib/data/adapters/rapidapi/hiring-signals'
import type { RiskCompetitiveProfile } from '@/lib/data/adapters/rapidapi/risk-competitive'

// Combined enrichment data for a single account
export interface AccountEnrichment {
  customerName: string
  slug: string
  companyProfile?: CompanyProfile
  financials?: PublicCompanyFinancials
  hiringSignals?: HiringSignal
  riskCompetitive?: RiskCompetitiveProfile
  recentNews?: SentimentNewsArticle[]
  enrichedAt: string
  enrichmentStatus: {
    company: 'ok' | 'error' | 'pending' | 'skipped'
    financials: 'ok' | 'error' | 'pending' | 'skipped'
    hiring: 'ok' | 'error' | 'pending' | 'skipped'
    risk: 'ok' | 'error' | 'pending' | 'skipped'
    news: 'ok' | 'error' | 'pending' | 'skipped'
  }
}
