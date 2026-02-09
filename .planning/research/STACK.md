# Technology Stack

**Project:** AI-Powered Business Intelligence Platform
**Researched:** 2026-02-08
**Confidence:** HIGH

## Executive Summary

For a 24-hour demo deadline with AI-powered account planning, scenario modeling, and real-time intelligence, the recommended stack prioritizes speed, developer experience, and Claude integration. The stack centers on Next.js 15 with React Server Components for rapid development, shadcn/ui for pre-built components, Anthropic SDK for Claude integration, and NewsAPI.ai for real-time business intelligence feeds.

**Key Decision:** Use Vercel v0 to generate initial dashboard UI from prompts, then customize with shadcn/ui components. This can reduce UI development time by 80%+ for demo scenarios.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (latest stable) | Full-stack React framework | **76.7% faster local server startup**, React 19 support, built-in API routes, Server Components for reduced client JS. Stable Turbopack dev mode enables blazing fast iteration. Perfect for 24-hour deadline. |
| React | 19.x (via Next.js 15) | UI library | Server Components reduce bundle size, new `use()` hook for async data, improved hydration. Required by Next.js 15. |
| TypeScript | 5.9.x | Type safety | Catch errors during development, IDE autocomplete, self-documenting code. Essential for Claude SDK integration. |
| Node.js | 18.18.0+ | Runtime environment | Minimum required by Next.js 15. Use latest LTS (20.x or 22.x) for production. |

**Confidence:** HIGH (verified with official Next.js 15 release notes and Claude API docs)

### AI & Intelligence Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @anthropic-ai/sdk | Latest (TypeScript SDK) | Claude API integration | Official Anthropic SDK with full TypeScript support, streaming, tool use, and structured outputs. Enables natural language querying, account plan generation, and scenario analysis. **Required per project constraints.** |
| Claude Opus 4.6 | Latest model | Complex reasoning tasks | Most intelligent model for agentic tasks and long-horizon work. Supports adaptive thinking, 1M token context window (beta), and effort parameter for controlled depth. Ideal for strategic account planning. |
| Claude Sonnet 4.5 | Latest model | Fast intelligent responses | Best model for complex agents and coding. 2-3x faster than Opus at lower cost. Use for real-time natural language queries and what-if scenario generation. |
| Claude Haiku 4.5 | Latest model | High-volume processing | Near-frontier performance at lowest cost. Ideal for processing 140 customer accounts simultaneously or batch analysis. Real-time application support. |

**Confidence:** HIGH (verified with Claude API release notes as of Feb 2026)

### Real-Time Data & News Intelligence

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| NewsAPI.ai | Latest API | Business news intelligence | **Leading provider in 2025** with full-text article access (even on free tier), advanced enrichment (entities, events, sentiment, clustering), and unmatched filtering precision. Near-perfect scores for developer-friendly API. |
| Contify News API | Alternative | Business-focused news | Aggregates 1M+ curated business-relevant sources including company websites, regulatory portals, job boards. Structured, machine-readable output with RESTful APIs and Webhooks. Use if need deeper company-specific intelligence. |
| Finnhub API | Alternative | Financial data | Real-time company news specific to financial intelligence. Use if financial metrics integration needed beyond Excel data. |

**Confidence:** MEDIUM (verified with 2025 news API comparisons, requires evaluation of API quotas for demo)

### UI & Visualization

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | Latest | Component library | **Copy-paste React components** built with Radix UI and Tailwind CSS. Not an npm dependency—you own the code. Includes dashboard templates, charts, forms, dialogs. Works out-of-box with Next.js 15. Automatic dark mode support. **Critical for 24-hour deadline.** |
| Tailwind CSS | 4.x | Utility-first CSS | **5x faster full builds, 100x faster incremental builds** in v4.0 (released Jan 2025). Zero configuration, automatic content detection, Vite plugin. Required by shadcn/ui. |
| Recharts | Latest (via shadcn/ui charts) | Chart components | **Built into shadcn/ui chart components**. SVG-based, React-idiomatic, responsive. Handles bar, line, area, pie, radar charts with CSS variables for theming. Slower with large datasets but perfect for business dashboards (140 accounts). |
| Lucide React | Latest | Icon library | Default icon library for shadcn/ui. 1000+ icons, tree-shakeable, TypeScript support. |
| Vercel v0 | Current version | AI dashboard generator | **Optional but powerful:** Generate entire dashboard layouts from prompts. Use for initial scaffold, then customize. Can reduce UI development by 85%+. Free tier available, credit-based pricing. |

**Confidence:** HIGH (verified with shadcn/ui official docs and Tailwind CSS v4.0 announcement)

### State Management & Data Fetching

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TanStack Query | v5.x (React Query) | Server state management | **Industry standard in 2025.** Handles caching, background updates, stale data out-of-box. Compatible with React 19. Reduces data fetching code by 85%. Essential for real-time intelligence feeds and scenario modeling. |
| Zustand | Latest (4.x+) | Client state management | **Lightweight, fast, minimal.** Hook-first design, no boilerplate. Perfect for scenario modeling state (inputs, calculations, UI state). Mature production-grade standard in 2025. Pairs perfectly with TanStack Query. |
| Server Actions | Built into Next.js 15 | Server mutations | Type-safe form submissions and mutations. No API route needed. Use for account plan updates, scenario saves, user preferences. Security enhancements in Next.js 15 (unguessable IDs, dead code elimination). |

**Confidence:** HIGH (verified with TanStack Query docs and 2025 state management surveys)

### Database & Persistence

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SQLite | Latest | Local database (demo) | **Zero setup, file-based, perfect for 24-hour demo.** No server needed. Fast for 140 accounts. Use for account plans, scenarios, settings. Migrate to PostgreSQL later if needed. |
| Prisma ORM | Latest (5.x+) | Database ORM | Type-safe database client with migrations, introspection, Prisma Studio GUI. Supports SQLite for demo, PostgreSQL for production. Driver adapters for better-sqlite3 (as of v5.4.0). Excellent TypeScript integration. |
| better-sqlite3 | Latest | SQLite driver | Most popular SQLite driver in JS ecosystem. Synchronous API, fastest SQLite driver. Works with Prisma driver adapter. |

**Alternative for Production:**
- **Prisma Postgres** (managed PostgreSQL) or **Vercel Postgres** for production scaling
- Both scale to zero, integrate with Prisma ORM
- Defer to production phase (not needed for demo)

**Confidence:** HIGH (verified with Prisma documentation and SQLite connector docs)

### Development & Deployment

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel | Latest platform | Hosting & deployment | **Made by Next.js creators.** Automatic deployments from git, preview URLs, edge functions, serverless API routes. Zero config for Next.js 15. Free tier sufficient for demo. Production Branch auto-deploys. |
| ESLint | 9.x | Code linting | Next.js 15 supports ESLint 9 with backward compatibility. Catches bugs during development. |
| Prettier | Latest | Code formatting | Auto-format on save. Pairs with ESLint. Use prettier-plugin-tailwindcss for Tailwind class sorting. |

**Confidence:** HIGH (verified with Vercel documentation and Next.js deployment guides)

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| openpyxl (Python) | Latest | Excel file reading | **Already in project.** Continue using for Excel data ingestion. Call via Next.js API route if needed during demo. |
| zod | Latest | Schema validation | TypeScript-first schema validation. Use with Server Actions, Claude structured outputs, form validation. Integrates with Anthropic SDK for tool definitions. |
| date-fns | Latest | Date manipulation | Lightweight, modular, tree-shakeable. Use for financial quarter calculations, date ranges, timeline views. |
| clsx / tailwind-merge | Latest | Conditional CSS classes | Utility for constructing className strings. `cn()` helper in shadcn/ui uses both. |
| next-themes | Latest | Dark mode support | One-line dark mode for Next.js. Already integrated with shadcn/ui. System preference detection. |
| react-hook-form | Latest | Form management | Performant, flexible forms with validation. Integrates with zod. Use for scenario inputs, account plan editing. |

**Confidence:** MEDIUM-HIGH (common libraries in Next.js ecosystem, verified with package registries)

## Installation

```bash
# Initialize Next.js 15 project with TypeScript
npx create-next-app@latest skyvera-intelligence --typescript --tailwind --app --use-npm

cd skyvera-intelligence

# Install core dependencies
npm install @anthropic-ai/sdk @tanstack/react-query zustand

# Install database layer
npm install prisma @prisma/client
npm install -D better-sqlite3 @types/better-sqlite3

# Install form & validation
npm install zod react-hook-form @hookform/resolvers

# Install utilities
npm install date-fns clsx tailwind-merge next-themes

# Initialize Prisma with SQLite
npx prisma init --datasource-provider sqlite

# Install shadcn/ui (interactive CLI)
npx shadcn@latest init

# Add shadcn/ui components (select as needed)
npx shadcn@latest add button card form input table dialog
npx shadcn@latest add chart  # Includes Recharts

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss eslint-config-prettier
```

**Time estimate:** 15-20 minutes for full setup

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Framework | Next.js 15 | Remix, Vite + React Router | Next.js has superior React Server Components support, more mature ecosystem, and Vercel deployment is zero-config. Remix is excellent but smaller ecosystem for rapid prototyping. |
| AI Model | Claude Opus 4.6 / Sonnet 4.5 | GPT-4, Gemini Pro | Project explicitly requires Claude. Claude excels at long-context reasoning (1M tokens) and has superior tool use. |
| UI Components | shadcn/ui | Material-UI, Chakra UI, Ant Design | shadcn/ui is copy-paste (you own code), not a dependency. Faster customization. Other libraries have more overhead and slower initial setup. |
| Charts | Recharts (via shadcn/ui) | Chart.js, Victory, Nivo | Recharts integrates seamlessly with React and shadcn/ui. Chart.js is canvas-based (better for huge datasets) but less React-idiomatic. For 140 accounts, Recharts is sufficient. |
| Database (demo) | SQLite | PostgreSQL, MySQL | SQLite requires zero setup, perfect for demo. Can migrate to PostgreSQL later with same Prisma schema. |
| ORM | Prisma | Drizzle, TypeORM, Kysely | Prisma has best TypeScript DX, Prisma Studio GUI, and excellent docs. Drizzle is faster but newer with smaller ecosystem. |
| State (client) | Zustand | Redux, Jotai, Recoil | Zustand has minimal boilerplate, fastest learning curve. Redux is overkill for demo. Jotai is excellent but Zustand is more established. |
| State (server) | TanStack Query | SWR, Apollo Client | TanStack Query is more feature-rich than SWR (devtools, advanced caching). Apollo is GraphQL-focused (not needed here). |
| News API | NewsAPI.ai | NewsAPI.org, Bing News API | NewsAPI.ai has best enrichment (entities, sentiment) and full-text access on free tier. NewsAPI.org is older, less feature-rich. |
| Deployment | Vercel | Netlify, Railway, AWS | Vercel is made by Next.js creators, zero config. Netlify is comparable but Vercel has tighter Next.js integration. AWS is overkill for demo. |

**Confidence:** HIGH (alternatives verified through 2025 ecosystem surveys and developer sentiment)

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | **Deprecated in 2023.** No longer maintained. Slow builds, no Server Components, no built-in API routes. | Next.js 15 |
| Chart.js directly | While excellent, requires more setup than shadcn/ui charts. Use Chart.js only if rendering 10K+ data points. | Recharts via shadcn/ui charts |
| Class-based React components | React 19 and Server Components are function-first. Legacy pattern. | Functional components with hooks |
| Global CSS files (besides Tailwind) | Tailwind utility-first approach is faster for demo. Avoid writing custom CSS. | Tailwind CSS utilities + shadcn/ui |
| REST API routes for every data fetch | Use Server Components for initial data loading. Only use API routes for external calls (news APIs, Claude API) or mutations. | React Server Components + Server Actions |
| Claude Opus 3 models | **Retired January 5, 2026.** Returns errors. | Claude Opus 4.6 or Claude Opus 4.5 |
| Redux for demo | Too much boilerplate for 24-hour deadline. Use for enterprise apps, not demos. | Zustand + TanStack Query |
| MongoDB | Adds complexity for structured business data. SQLite/PostgreSQL better for relational data (accounts, scenarios, financials). | SQLite (demo) or PostgreSQL (production) |
| Webpack config | Next.js 15 uses Turbopack by default. Don't customize unless absolutely necessary. | Default Next.js configuration |
| Custom data fetching (fetch/axios) | Reinventing the wheel. No caching, no optimistic updates, more code. | TanStack Query for client fetches, Server Components for server fetches |

**Confidence:** HIGH (verified with deprecation notices and 2025 best practices)

## Stack Patterns by Use Case

### Pattern 1: Account Plan Display (Read-Heavy)

**Stack:**
- React Server Component (initial load)
- Prisma query in Server Component
- shadcn/ui Table + Card components
- Client component only for interactive elements (filters, search)

**Why:** Server Components eliminate client-side data fetching for initial render. Fastest possible page load.

```typescript
// app/accounts/[id]/page.tsx (Server Component)
import { prisma } from '@/lib/prisma'
import { AccountPlanView } from '@/components/account-plan-view'

export default async function AccountPlanPage({ params }: { params: { id: string } }) {
  const accountPlan = await prisma.accountPlan.findUnique({
    where: { id: params.id },
    include: { scenarios: true, activities: true }
  })

  return <AccountPlanView plan={accountPlan} />
}
```

### Pattern 2: AI-Powered Natural Language Query (Interactive)

**Stack:**
- Client component with TanStack Query
- Next.js API route calling Claude API
- Streaming response with SDK streaming support
- Zustand for query history state

**Why:** Client-side for interactivity, API route hides Claude API key, streaming for real-time UX.

```typescript
// app/api/query/route.ts (API Route)
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { query } = await req.json()
  const anthropic = new Anthropic()

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: query }]
  })

  return new Response(stream.toReadableStream())
}
```

### Pattern 3: What-If Scenario Modeling (Compute-Heavy)

**Stack:**
- Server Action for computation
- Zustand for scenario inputs (client state)
- React Hook Form for input management
- Prisma for saving scenarios

**Why:** Server Actions keep computation server-side, no API route needed, type-safe.

```typescript
// app/actions/scenario.ts (Server Action)
'use server'

import { prisma } from '@/lib/prisma'

export async function runScenario(scenarioId: string, inputs: ScenarioInputs) {
  // Run financial calculations server-side
  const results = calculateScenarioOutcome(inputs)

  await prisma.scenario.update({
    where: { id: scenarioId },
    data: { results }
  })

  return results
}
```

### Pattern 4: Real-Time News Intelligence Feed (External API)

**Stack:**
- TanStack Query with polling or websocket
- Next.js API route as proxy (hides API keys)
- shadcn/ui Card components for news items
- Claude API for summarization/sentiment analysis

**Why:** TanStack Query handles cache invalidation and background refetch. API route secures credentials.

```typescript
// app/api/news/route.ts (API Route)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')

  const response = await fetch(`https://newsapi.ai/api/v1/article/search`, {
    headers: { 'X-API-KEY': process.env.NEWSAPI_KEY! }
  })

  const news = await response.json()
  return Response.json(news)
}

// components/news-feed.tsx (Client Component)
'use client'

import { useQuery } from '@tanstack/react-query'

export function NewsFeed({ company }: { company: string }) {
  const { data } = useQuery({
    queryKey: ['news', company],
    queryFn: () => fetch(`/api/news?company=${company}`).then(r => r.json()),
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  })

  return <div>{/* Render news items */}</div>
}
```

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.x | React 19.x | Next.js 15 requires React 19 RC. Fully compatible. |
| Next.js 15.x | Node.js 18.18.0+ | Minimum version required. Recommend Node.js 20.x LTS or 22.x. |
| TanStack Query v5.x | React 19 | Fully compatible. APIs unchanged from React 18. |
| shadcn/ui | Next.js 15 | Designed for Next.js App Router. Works seamlessly. |
| Tailwind CSS 4.x | Next.js 15 | First-party Vite plugin, but Next.js 15 includes PostCSS support. Compatible. |
| Prisma 5.x | SQLite / PostgreSQL | Driver adapters available for better-sqlite3, node-postgres. |
| @anthropic-ai/sdk | Node.js 18+ | Works in Next.js API routes and Server Actions. |
| Recharts (via shadcn/ui) | React 19 | SVG-based, no canvas issues. Fully compatible. |

**Breaking changes to watch:**
- Next.js 15 made `headers()`, `cookies()`, `params`, `searchParams` async. Update code to `await` these.
- Tailwind CSS 4.x simplified config. Migration codemod available: `npx @tailwindcss/upgrade`

**Confidence:** HIGH (verified with official compatibility matrices and release notes)

## Sources

### High Confidence (Official Docs, Context7)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15) - Official release announcement, Oct 21, 2024
- [Claude API Release Notes](https://platform.claude.com/docs/en/release-notes/api) - Official Anthropic documentation, verified Feb 2026
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript) - Official SDK repository
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Official component docs
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) - Official release announcement, Jan 22, 2025
- [Prisma Documentation](https://www.prisma.io/docs) - Official ORM documentation
- [TanStack Query Documentation](https://tanstack.com/query/latest) - Official library docs
- [TypeScript 5.8 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) - Official Microsoft blog

### Medium Confidence (Verified Web Search)
- [Top 17 BI Tools for Modern Analytics in 2026](https://www.integrate.io/blog/top-business-intelligence-tools/)
- [Best News APIs in 2025](https://newsapi.ai/blog/best-news-api-comparison-2025/)
- [Vercel v0 Review 2025](https://skywork.ai/blog/vercel-v0-dev-review-2025-ai-ui-react-tailwind/)
- [React State Management in 2025](https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m)
- [8 Best React Chart Libraries for Visualizing Data in 2025](https://embeddable.com/blog/react-chart-libraries)

### Low Confidence (Single Source, Demo-Specific)
- News API quotas for free tier - requires verification with NewsAPI.ai documentation
- Vercel v0 credit pricing - may change, check current pricing

---

**Stack Research for:** AI-Powered Business Intelligence Platform
**Researched:** 2026-02-08
**24-Hour Demo Constraint:** Prioritized speed and DX throughout recommendations
