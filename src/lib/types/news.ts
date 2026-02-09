import { z } from 'zod'

/**
 * News article types and schemas for external news intelligence
 * Models news articles with sentiment analysis and relevance scoring
 */

export const NewsArticleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  publishedAt: z.union([z.string(), z.date()]),
  source: z.string(),
  url: z.string().url(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
})
export type NewsArticle = z.infer<typeof NewsArticleSchema>

export const CustomerNewsSchema = z.object({
  customerName: z.string(),
  articles: z.array(NewsArticleSchema),
  fetchedAt: z.string(),
  articleCount: z.number().int().min(0),
})
export type CustomerNews = z.infer<typeof CustomerNewsSchema>
