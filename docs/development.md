# Developer Guide

Comprehensive guide for developers working on the Skyvera Executive Intelligence System.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Code Organization](#code-organization)
- [Adding New Features](#adding-new-features)
- [Adding Data Adapters](#adding-data-adapters)
- [Working with Semantic Layer](#working-with-semantic-layer)
- [Testing Guidelines](#testing-guidelines)
- [Git Workflow](#git-workflow)
- [Code Review Checklist](#code-review-checklist)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Prisma

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd Skyvera

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your API keys to .env.local
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./dev.db

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev

# Seed database (in another terminal or browser)
curl -X POST http://localhost:3000/api/seed
```

### Development Workflow

```bash
# Start dev server (with hot reload)
npm run dev

# Run linter
npm run lint

# Run tests
npm run test:e2e

# Build for production (to verify)
npm run build

# View database in Prisma Studio
npx prisma studio
```

---

## Project Structure

```
Skyvera/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (routes)/
│   │   │   ├── dashboard/             # Executive dashboard
│   │   │   │   ├── page.tsx           # Main page (Server Component)
│   │   │   │   ├── loading.tsx        # Loading state
│   │   │   │   ├── error.tsx          # Error boundary
│   │   │   │   ├── sections/          # Dashboard sections
│   │   │   │   └── components/        # Dashboard-specific components
│   │   │   ├── accounts/              # Customer intelligence
│   │   │   │   ├── page.tsx           # Account list
│   │   │   │   ├── [name]/            # Dynamic account page
│   │   │   │   │   ├── page.tsx       # Account detail (7 tabs)
│   │   │   │   │   └── _components/   # Tab components (private)
│   │   │   │   └── components/        # Shared account components
│   │   │   ├── query/                 # Natural language queries
│   │   │   ├── scenario/              # Scenario modeling
│   │   │   └── product-agent/         # Product intelligence
│   │   ├── api/                       # API routes
│   │   │   ├── health/route.ts
│   │   │   ├── query/route.ts
│   │   │   ├── scenarios/analyze/route.ts
│   │   │   ├── product-agent/
│   │   │   │   ├── analyze/route.ts
│   │   │   │   └── generate-prd/route.ts
│   │   │   └── seed/route.ts
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home page
│   │   ├── global-error.tsx           # Global error boundary
│   │   └── not-found.tsx              # 404 page
│   ├── components/
│   │   └── ui/                        # Reusable UI components
│   │       ├── nav-bar.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── health-indicator.tsx
│   │       └── ...
│   └── lib/
│       ├── intelligence/              # AI & Intelligence layer
│       │   ├── claude/
│       │   │   ├── orchestrator.ts    # Claude API orchestrator
│       │   │   ├── rate-limiter.ts    # Rate limiting
│       │   │   └── prompts/           # Prompt templates
│       │   │       ├── system.ts
│       │   │       ├── nl-query.ts
│       │   │       ├── scenario-impact.ts
│       │   │       └── account-intel.ts
│       │   ├── nlq/                   # Natural language queries
│       │   │   ├── interpreter.ts
│       │   │   ├── canned-queries.ts
│       │   │   └── types.ts
│       │   └── scenarios/             # Scenario modeling
│       │       ├── calculator.ts
│       │       ├── analyzer.ts
│       │       └── types.ts
│       ├── data/                      # Data layer
│       │   ├── adapters/              # Data source adapters
│       │   │   ├── base.ts
│       │   │   ├── excel/
│       │   │   │   ├── parser.ts
│       │   │   │   └── transforms.ts
│       │   │   └── external/
│       │   │       └── newsapi.ts
│       │   ├── providers/             # Data providers
│       │   │   └── real-provider.ts
│       │   ├── registry/              # Adapter registry
│       │   │   └── connector-factory.ts
│       │   └── server/                # Server-side data fetchers
│       │       ├── dashboard-data.ts
│       │       ├── account-data.ts
│       │       ├── account-plan-data.ts
│       │       ├── alert-data.ts
│       │       └── scenario-data.ts
│       ├── semantic/                  # Semantic layer
│       │   ├── schema/
│       │   │   ├── financial.ts
│       │   │   ├── customer.ts
│       │   │   └── index.ts
│       │   ├── resolver.ts
│       │   └── validator.ts
│       ├── cache/                     # Cache management
│       │   └── manager.ts
│       ├── db/                        # Database
│       │   └── prisma.ts
│       ├── types/                     # TypeScript types
│       │   ├── result.ts
│       │   ├── financial.ts
│       │   ├── customer.ts
│       │   ├── account-plan.ts
│       │   └── index.ts
│       ├── config/                    # Configuration
│       │   └── env.ts
│       └── errors/                    # Error types
│           └── index.ts
├── prisma/
│   └── schema.prisma                  # Database schema
├── data/                              # Static data files
│   └── intelligence/                  # OSINT reports (140 accounts)
│       └── reports/
│           ├── Telstra.md
│           ├── BT.md
│           └── ...
├── docs/                              # Documentation
│   ├── api/                           # API documentation
│   ├── architecture.md
│   ├── deployment.md
│   ├── development.md
│   └── user-guide.md
├── tests/                             # E2E tests
│   └── e2e/
│       └── dashboard.spec.ts
├── scripts/                           # Utility scripts
│   ├── seed-customers.ts
│   └── warmup-cache.ts
├── .env.example                       # Example environment file
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Dependencies
```

### Naming Conventions

- **Files**: kebab-case (`account-data.ts`, `dashboard-page.tsx`)
- **Components**: PascalCase (`AccountTable`, `KpiCard`)
- **Functions**: camelCase (`getDashboardData`, `calculateMetrics`)
- **Constants**: UPPER_SNAKE_CASE (`CACHE_TTL`, `MAX_RETRIES`)
- **Types**: PascalCase (`Customer`, `ClaudeRequest`)

---

## Code Organization

### Server vs Client Components

**Rule of thumb:**
- Default to Server Components
- Only use Client Components when you need:
  - Interactivity (`onClick`, `onChange`)
  - Browser APIs (`localStorage`, `window`)
  - React hooks (`useState`, `useEffect`)
  - Third-party libraries that require `window`

**Example Server Component:**
```typescript
// src/app/dashboard/page.tsx
// No 'use client' - runs on server

export default async function DashboardPage() {
  // Direct database access (server-side only)
  const data = await getDashboardData()

  return <DashboardContent data={data} />
}
```

**Example Client Component:**
```typescript
// src/app/query/components/query-input.tsx
'use client'

import { useState } from 'react'

export function QueryInput({ onSubmit }: Props) {
  const [query, setQuery] = useState('')

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit(query)
      }}
    />
  )
}
```

### Data Fetching Patterns

**Server Component (preferred):**
```typescript
// Fetch data directly in component
export default async function Page() {
  const customers = await prisma.customer.findMany()
  return <CustomerList customers={customers} />
}
```

**Server Function (reusable):**
```typescript
// src/lib/data/server/customer-data.ts
export async function getAllCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: { subscriptions: true }
    })
    return ok(customers)
  } catch (error) {
    return err(new Error('Failed to fetch customers'))
  }
}
```

**API Route (when client needs to call):**
```typescript
// src/app/api/customers/route.ts
export async function GET() {
  const result = await getAllCustomers()

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(result.value)
}
```

---

## Adding New Features

### Example: Add "Customer Churn Prediction" Feature

#### 1. Define Types

```typescript
// src/lib/types/churn-prediction.ts
export interface ChurnPrediction {
  customerName: string
  churnProbability: number  // 0-1
  riskFactors: string[]
  recommendedActions: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface ChurnPredictionRequest {
  customerName?: string
  bu?: string
  threshold?: number  // Only return if probability > threshold
}
```

#### 2. Create Database Models (if needed)

```prisma
// prisma/schema.prisma
model ChurnPrediction {
  id               Int      @id @default(autoincrement())
  customerName     String
  churnProbability Float
  riskFactors      String   // JSON array
  predictedAt      DateTime @default(now())

  @@index([customerName])
}
```

```bash
npx prisma generate
npx prisma db push
```

#### 3. Create Business Logic

```typescript
// src/lib/intelligence/churn/predictor.ts
import { prisma } from '@/lib/db/prisma'
import { getOrchestrator } from '@/lib/intelligence/claude/orchestrator'

export async function predictChurn(
  request: ChurnPredictionRequest
): Promise<Result<ChurnPrediction[]>> {
  try {
    // Load customer data
    const customers = await prisma.customer.findMany({
      where: {
        customerName: request.customerName,
        bu: request.bu
      },
      include: { subscriptions: true }
    })

    // Calculate churn probability for each customer
    const predictions = customers.map(customer => {
      const probability = calculateChurnProbability(customer)
      const riskFactors = identifyRiskFactors(customer)

      return {
        customerName: customer.customerName,
        churnProbability: probability,
        riskFactors,
        recommendedActions: getRecommendations(riskFactors),
        confidence: probability > 0.8 ? 'high' : probability > 0.5 ? 'medium' : 'low'
      }
    })

    // Filter by threshold
    const filtered = predictions.filter(p =>
      !request.threshold || p.churnProbability > request.threshold
    )

    return ok(filtered)
  } catch (error) {
    return err(new Error('Churn prediction failed'))
  }
}

function calculateChurnProbability(customer: Customer): number {
  let score = 0

  // Payment issues
  if (customer.healthScore === 'Critical') score += 0.4
  else if (customer.healthScore === 'At Risk') score += 0.2

  // Revenue decline
  if (customer.rr < customer.nrr) score += 0.2

  // Contract renewal
  const renewal = customer.subscriptions.find(s => s.willRenew === 'No')
  if (renewal) score += 0.3

  return Math.min(1, score)
}
```

#### 4. Create API Route

```typescript
// src/app/api/churn/predict/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { predictChurn } from '@/lib/intelligence/churn/predictor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await predictChurn(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      predictions: result.value,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### 5. Create UI Components

```typescript
// src/app/churn/components/churn-prediction-table.tsx
'use client'

import { ChurnPrediction } from '@/lib/types/churn-prediction'

export function ChurnPredictionTable({
  predictions
}: {
  predictions: ChurnPrediction[]
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Churn Probability</th>
          <th>Risk Factors</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {predictions.map(pred => (
          <tr key={pred.customerName}>
            <td>{pred.customerName}</td>
            <td>{(pred.churnProbability * 100).toFixed(1)}%</td>
            <td>{pred.riskFactors.join(', ')}</td>
            <td>{pred.confidence}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

#### 6. Create Page

```typescript
// src/app/churn/page.tsx
import { ChurnPredictionTable } from './components/churn-prediction-table'
import { predictChurn } from '@/lib/intelligence/churn/predictor'

export default async function ChurnPredictionPage() {
  const result = await predictChurn({ threshold: 0.5 })

  if (!result.success) {
    return <div>Error: {result.error.message}</div>
  }

  return (
    <div>
      <h1>Customer Churn Prediction</h1>
      <ChurnPredictionTable predictions={result.value} />
    </div>
  )
}
```

#### 7. Add to Navigation

```typescript
// src/components/ui/nav-bar.tsx
const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/churn', label: 'Churn Prediction' },  // New
  // ...
]
```

#### 8. Write Tests

```typescript
// tests/e2e/churn.spec.ts
import { test, expect } from '@playwright/test'

test('churn prediction page loads', async ({ page }) => {
  await page.goto('/churn')

  await expect(page.getByRole('heading', { name: 'Customer Churn Prediction' })).toBeVisible()

  const table = page.locator('table')
  await expect(table).toBeVisible()
})
```

---

## Adding Data Adapters

### Example: Add Salesforce Adapter

#### 1. Define Adapter Interface

```typescript
// src/lib/data/adapters/salesforce/adapter.ts
import { DataAdapter } from '../base'
import jsforce from 'jsforce'

export class SalesforceAdapter implements DataAdapter {
  name = 'salesforce'
  private connection: jsforce.Connection

  constructor() {
    this.connection = new jsforce.Connection({
      loginUrl: process.env.SALESFORCE_URL || 'https://login.salesforce.com'
    })
  }

  async connect(): Promise<Result<void>> {
    try {
      await this.connection.login(
        process.env.SALESFORCE_USERNAME!,
        process.env.SALESFORCE_PASSWORD!
      )
      return ok(undefined)
    } catch (error) {
      return err(new Error('Salesforce connection failed'))
    }
  }

  async getCustomers(): Promise<Result<Customer[]>> {
    try {
      const records = await this.connection.query(`
        SELECT Name, ARR__c, Health_Score__c
        FROM Account
        WHERE Type = 'Customer'
      `)

      const customers = records.records.map(r => ({
        customerName: r.Name,
        arr: r.ARR__c,
        healthScore: r.Health_Score__c
      }))

      return ok(customers)
    } catch (error) {
      return err(new Error('Failed to fetch customers from Salesforce'))
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.connection.identity()
      return true
    } catch {
      return false
    }
  }
}
```

#### 2. Register Adapter

```typescript
// src/lib/data/registry/connector-factory.ts
import { SalesforceAdapter } from '../adapters/salesforce/adapter'

export class ConnectorFactory {
  private adapters = new Map<string, DataAdapter>()

  async initialize() {
    this.adapters.set('excel', new ExcelAdapter())
    this.adapters.set('newsapi', new NewsAPIAdapter())
    this.adapters.set('salesforce', new SalesforceAdapter())  // New

    // Connect all adapters
    for (const [name, adapter] of this.adapters) {
      const result = await adapter.connect()
      if (result.success) {
        console.log(`✓ ${name} adapter connected`)
      }
    }
  }
}
```

#### 3. Use in Data Fetchers

```typescript
// src/lib/data/server/customer-data.ts
export async function syncCustomersFromSalesforce() {
  const factory = await getConnectorFactory()
  const salesforce = factory.getAdapter('salesforce')

  if (!salesforce) {
    return err(new Error('Salesforce adapter not available'))
  }

  const result = await salesforce.getCustomers()

  if (!result.success) {
    return result
  }

  // Sync to database
  for (const customer of result.value) {
    await prisma.customer.upsert({
      where: { customerName: customer.customerName },
      update: { arr: customer.arr },
      create: customer
    })
  }

  return ok(result.value.length)
}
```

---

## Working with Semantic Layer

### Adding New Metric Definitions

```typescript
// src/lib/semantic/schema/financial.ts
export const financialMetrics = {
  // Existing metrics...

  // New metric
  customer_acquisition_cost: {
    name: 'Customer Acquisition Cost',
    abbreviation: 'CAC',
    description: 'Average cost to acquire a new customer',
    formula: 'Sales & Marketing Expenses / New Customers Acquired',
    unit: 'currency',
    businessContext: 'Key efficiency metric for growth. Target: < $10K for enterprise'
  },

  ltv_cac_ratio: {
    name: 'LTV/CAC Ratio',
    abbreviation: 'LTV:CAC',
    description: 'Customer lifetime value divided by acquisition cost',
    formula: 'Customer Lifetime Value / Customer Acquisition Cost',
    unit: 'ratio',
    businessContext: 'Health metric for growth sustainability. Target: > 3:1'
  }
}
```

### Using Metrics in Prompts

```typescript
// src/lib/intelligence/claude/prompts/system.ts
import { getSemanticLayer } from '@/lib/semantic/resolver'

export function buildSystemPrompt(): string {
  const semantic = getSemanticLayer()

  return `
You are a financial analyst for Skyvera.

## Financial Metrics
${semantic.getMetricDefinitions(['RR', 'ARR', 'CAC', 'ltv_cac_ratio'])}

Use these definitions when answering questions.
  `
}
```

---

## Testing Guidelines

### Unit Tests (Future)

```typescript
// src/lib/intelligence/scenarios/__tests__/calculator.test.ts
import { describe, it, expect } from 'vitest'
import { ScenarioCalculator } from '../calculator'

describe('ScenarioCalculator', () => {
  it('calculates price increase impact correctly', () => {
    const calculator = new ScenarioCalculator()
    const baseline = { revenue: 1000000 }

    const result = calculator.calculate({
      scenarioType: 'pricing_change',
      assumptions: {
        priceIncreasePercent: 10,
        affectedCustomerPercent: 80,
        expectedChurnRate: 5
      }
    }, baseline)

    expect(result.projectedRevenue).toBe(1036000)
  })
})
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('dashboard loads with correct data', async ({ page }) => {
  await page.goto('/dashboard')

  // Check header
  await expect(page.getByRole('heading', { name: 'Skyvera Executive Intelligence' })).toBeVisible()

  // Check KPIs are present
  await expect(page.getByText('Total Revenue')).toBeVisible()
  await expect(page.getByText('$14.7M')).toBeVisible()
})

test('can query customers', async ({ page }) => {
  await page.goto('/query')

  await page.getByPlaceholder('Ask a question...').fill('Show top 5 customers')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText('Telstra')).toBeVisible()
})
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/dashboard.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with UI
npm run test:e2e:ui

# Debug tests
npx playwright test --debug
```

---

## Git Workflow

### Branch Naming

```
feature/add-churn-prediction
bugfix/fix-dashboard-loading
hotfix/critical-api-error
docs/update-api-documentation
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add churn prediction feature
fix: resolve dashboard loading issue
docs: update API documentation
refactor: improve cache manager performance
test: add E2E tests for query page
chore: update dependencies
```

### Workflow

```bash
# Create feature branch
git checkout -b feature/add-churn-prediction

# Make changes and commit
git add .
git commit -m "feat: add churn prediction model"

# Push to remote
git push origin feature/add-churn-prediction

# Create pull request on GitHub
# After approval, merge to main
```

---

## Code Review Checklist

### Reviewer Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is present (Result type usage)
- [ ] Server/Client Components used appropriately
- [ ] Database queries are optimized (indexes, select specific fields)
- [ ] API routes have input validation (Zod schemas)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No sensitive data exposed
- [ ] Performance considerations addressed

---

## Common Patterns

### Result Type for Error Handling

```typescript
// ✅ DO: Use Result type
async function fetchCustomer(name: string): Promise<Result<Customer>> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { customerName: name }
    })

    if (!customer) {
      return err(new Error('Customer not found'))
    }

    return ok(customer)
  } catch (error) {
    return err(new Error('Database error'))
  }
}

// Usage
const result = await fetchCustomer('Telstra')
if (!result.success) {
  return handleError(result.error)
}
const customer = result.value
```

### Zod Validation

```typescript
import { z } from 'zod'

const customerSchema = z.object({
  customerName: z.string().min(1),
  bu: z.enum(['Cloudsense', 'Kandy', 'STL']),
  rr: z.number().nonnegative(),
  nrr: z.number().nonnegative()
})

const validation = customerSchema.safeParse(body)
if (!validation.success) {
  return error(validation.error)
}
```

---

## Troubleshooting

### Issue: TypeScript errors after schema change

```bash
# Regenerate Prisma client
npx prisma generate

# Restart Next.js dev server
npm run dev
```

### Issue: Hot reload not working

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Database locked (SQLite)

```bash
# Close all connections
pkill -f "next-server"

# Restart dev server
npm run dev
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
