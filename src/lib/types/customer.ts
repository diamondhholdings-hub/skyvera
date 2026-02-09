import { z } from 'zod'

/**
 * Customer types and Zod schemas matching existing Skyvera customer data structure
 * Models customer records with subscriptions, revenue breakdown, and health scoring
 */

// Subscription schema matching JSON structure
export const SubscriptionSchema = z.object({
  sub_id: z.union([z.number(), z.string()]).nullable(), // Can be number, string like "sandboxes", or null
  arr: z.number().nullable(),
  renewal_qtr: z.string().nullable(),
  will_renew: z.string().nullable(), // "Yes", "No", "TBD", "No (SF)", "BU decision required"
  projected_arr: z.number().nullable(),
})
export type Subscription = z.infer<typeof SubscriptionSchema>

// Core customer schema matching JSON structure
export const CustomerSchema = z.object({
  customer_name: z.string(),
  rr: z.number().min(0),
  nrr: z.number().min(0),
  total: z.number().min(0),
  subscriptions: z.array(SubscriptionSchema),
  rank: z.number().int().optional(),
  pct_of_total: z.number().optional(),
})
export type Customer = z.infer<typeof CustomerSchema>

// Customer with health score (for intelligence features)
export const CustomerWithHealthSchema = CustomerSchema.extend({
  bu: z.string(), // BU name annotated during data assembly
  healthScore: z.enum(['green', 'yellow', 'red']),
  healthFactors: z.array(z.string()),
})
export type CustomerWithHealth = z.infer<typeof CustomerWithHealthSchema>

// BU customer data (top-level structure from JSON)
export const BUCustomerDataSchema = z.object({
  bu_name: z.string(),
  total_revenue: z.number().min(0),
  customer_count: z.number().int().min(0),
  customers: z.array(CustomerSchema),
})
export type BUCustomerData = z.infer<typeof BUCustomerDataSchema>
