import { z } from 'zod'

/**
 * Environment configuration with Zod validation
 * API keys are optional to prevent crashes during development without them
 * They'll be validated at runtime when actually used
 */

const envSchema = z.object({
  TFY_API_KEY: z.string().min(1).optional(),
  TFY_BASE_URL: z.string().url().optional(),
  TFY_MODEL_GROUP: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  NEWSAPI_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().default('file:./dev.db'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
