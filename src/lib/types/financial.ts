import { z } from 'zod'

/**
 * Financial types and Zod schemas for all Skyvera financial metrics
 * Models ARR, quarterly RR, NRR, margins, EBITDA, and BU-level summaries
 */

// Business Unit enum - includes NewNet since it exists in data/
export const BUEnum = z.enum(['Cloudsense', 'Kandy', 'STL', 'NewNet'])
export type BU = z.infer<typeof BUEnum>

// Quarterly RR (Recurring Revenue) schema
export const QuarterlyRRSchema = z.object({
  bu: BUEnum,
  quarterlyRR: z.number().min(0),
  quarter: z.string().regex(/^Q[1-4]'[0-9]{2}$/, 'Quarter must be in format Q#\'YY'),
})
export type QuarterlyRR = z.infer<typeof QuarterlyRRSchema>

// ARR (Annual Recurring Revenue) schema - extends QuarterlyRR
export const ARRSchema = QuarterlyRRSchema.extend({
  arr: z.number().min(0),
})
export type ARR = z.infer<typeof ARRSchema>

// Calculate ARR from quarterly RR
export function calculateARR(quarterlyRR: number): number {
  return quarterlyRR * 4
}

// Complete financial metrics schema
export const FinancialMetricsSchema = z.object({
  bu: BUEnum,
  quarterlyRR: z.number().min(0),
  arr: z.number().min(0),
  nrr: z.number().min(0),
  grossMargin: z.number().min(0).max(100), // Percentage
  netMargin: z.number().min(0).max(100),   // Percentage
  ebitda: z.number(),
  totalRevenue: z.number().min(0),
  cogs: z.number().min(0),
  headcountCost: z.number().min(0),
  vendorCost: z.number().min(0),
})
export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>

// BU-level financial summary
export const BUFinancialSummarySchema = z.object({
  bu: BUEnum,
  totalRR: z.number().min(0),
  totalNRR: z.number().min(0),
  totalRevenue: z.number().min(0),
  customerCount: z.number().int().min(0),
  netMarginPct: z.number().min(0).max(100),
  netMarginTarget: z.number().min(0).max(100),
  ebitda: z.number(),
})
export type BUFinancialSummary = z.infer<typeof BUFinancialSummarySchema>
