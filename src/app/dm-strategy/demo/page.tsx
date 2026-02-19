import { redirect } from 'next/navigation'
import DemoClient from './demo-client'

/**
 * Demo Page - Shows all DM% Strategy Components with Sample Data
 * Gated behind NODE_ENV=development — redirects to main page in production.
 */
export default function DMStrategyDemoPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/dm-strategy')
  }

  return <DemoClient />
}
