# Skyvera Executive Intelligence System

> AI-powered executive intelligence platform for multi-business unit SaaS portfolio management, delivering real-time financial analysis, customer intelligence, and strategic insights.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-purple)](https://www.anthropic.com/claude)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)

## Overview

Skyvera Intelligence System is a production-ready executive intelligence platform designed for portfolio companies managing multiple business units. It combines financial data analysis, customer intelligence, scenario modeling, and AI-powered natural language queries to deliver actionable insights for strategic decision-making.

**Key Business Problems Solved:**
- **Real-time Portfolio Monitoring**: Track $14.7M quarterly revenue across 3 business units (Cloudsense, Kandy, STL)
- **Customer Health Intelligence**: Monitor 140+ enterprise accounts with AI-powered health scoring and churn risk detection
- **Scenario Planning**: Model business impacts (pricing changes, churn scenarios, expansion opportunities)
- **Natural Language Insights**: Ask complex financial questions in plain English, powered by Claude AI
- **Account Intelligence**: Comprehensive OSINT-powered account plans with 8-tab structure (overview, financials, key-executives, org-structure, pain-points, competitive, action-plan, intelligence)
- **Product Intelligence**: AI-driven pattern detection for identifying product opportunities from customer data

## Quick Start (5 Minutes)

### Prerequisites

- **Node.js**: 20.x or later
- **npm**: 9.x or later
- **Anthropic API Key**: Get one at [console.anthropic.com](https://console.anthropic.com/)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Skyvera

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local and add your API keys:
# ANTHROPIC_API_KEY=sk-ant-...
# DATABASE_URL=file:./dev.db

# Initialize the database
npx prisma generate
npx prisma db push

# Seed initial customer data from Excel
npm run dev
# Then visit http://localhost:3000/api/seed (POST request)
# Or use curl: curl -X POST http://localhost:3000/api/seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features

### 1. Executive Dashboard
- Real-time KPIs: Total Revenue, Recurring Revenue, EBITDA, Net Margin
- Business unit performance comparison (Cloudsense, Kandy, STL)
- Top 20 customers by revenue with health indicators
- At-risk accounts with churn probability
- Expansion opportunities with ARR potential
- Strategic action plan with prioritized initiatives

### 2. Customer Intelligence
- **140+ Enterprise Accounts**: Complete portfolio tracking with subscription details
- **Health Scoring**: AI-powered risk assessment (Healthy, At Risk, Critical)
- **Account Plans**: 8-tab comprehensive intelligence
  - Overview: Executive summary, key metrics, renewal countdown, relationship strength
  - Financials: Revenue trends, contract details, payment history
  - Key Executives: Decision-maker profiles and contact intelligence
  - Org Structure: Org chart, stakeholders, reporting lines
  - Pain Points: Inline-editable pain point tracking with status cycling
  - Competitive: Competitor landscape, win/loss analysis
  - Action Plan: Kanban board for account planning with inline status editing
  - Intelligence: Market news, M&A activity, leadership changes (OSINT-powered)
- **Advanced Filtering**: By business unit, health score, revenue tier
- **URL-driven Search**: Debounced search bar with bookmarkable `?search=` state
- **Data Completeness Scoring**: 0-100% badge covering 7 dimensions (stakeholders, pain points, competitors, opportunities, actions, intelligence, enrichment)
- **Renewal Countdown**: Days-to-renewal indicator in account overview
- **Last-Enriched Badge**: Shows when account data was last refreshed
- **Per-Account AI Chat**: Floating streaming chat panel with full account context powered by Claude
- **Print/PDF Export**: `@media print` layout for clean A4 account plan export
- **Inline Status Editing**: Optimistic status cycling on pain points and action items
- **OpenCorporates Integration**: Corporate registry data — directors, legal name, jurisdiction
- **RapidAPI Enrichment Pipeline**: 5 adapters — financial-intel, hiring-signals, news-sentiment, risk-competitive, enrichment

### 3. Natural Language Queries
- Ask questions in plain English: "Which customers are at risk of churning?"
- Semantic understanding of financial metrics (RR, ARR, NRR, EBITDA)
- Context-aware responses powered by Claude Sonnet 4.6
- Canned queries for common analysis patterns
- Full metrics catalog with definitions

### 4. Scenario Modeling
- **Pricing Changes**: Model impact of price increases/decreases
- **Churn Analysis**: Forecast revenue impact of customer losses
- **Expansion Planning**: Evaluate upsell opportunities
- AI-powered impact analysis with strategic recommendations
- Baseline comparison with variance calculation

### 5. Product Agent System
- **Pattern Detection**: Automatically identify opportunities from customer data
  - Churn risk patterns (AR aging + support volume)
  - Revenue decline signals
  - Expansion opportunities
  - Multi-BU consolidation needs
- **PRD Generation**: Auto-generate comprehensive 14-section Product Requirements Documents
- **Priority Scoring**: Multi-factor weighted scoring (ARR impact, customer count, confidence, urgency)
- **Workflow Tracking**: Full lifecycle management from pattern detection to product launch

## Technology Stack

### Core Framework
- **Next.js 16.1**: React framework with App Router, Server Components, Server Actions
- **TypeScript 5.9**: Type-safe development
- **Tailwind CSS 4.1**: Utility-first styling with custom design system

### AI & Intelligence
- **Anthropic Claude Sonnet 4.6**: Natural language queries, scenario analysis, PRD generation, per-account chat
- **Custom Orchestrator**: Request queue, rate limiting, caching, retry logic
- **Semantic Layer**: Financial metric definitions with business context

### Data Layer
- **Prisma 5.22**: Type-safe ORM with SQLite (production-ready for Turso/PostgreSQL)
- **SQLite**: Development database (easily swappable)
- **Excel Integration**: Direct parsing of budget files (openpyxl-style transforms)

### UI Components
- **Recharts**: Financial visualizations
- **React Table**: Advanced data tables with sorting/filtering
- **Lucide Icons**: Consistent iconography
- **Sonner**: Toast notifications

## Project Structure

```
Skyvera/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Executive dashboard
│   │   ├── accounts/           # Customer intelligence
│   │   │   └── [name]/         # Individual account plans (8 tabs)
│   │   ├── query/              # Natural language queries
│   │   ├── scenario/           # Scenario modeling
│   │   ├── product-agent/      # Product intelligence system
│   │   └── api/                # API routes
│   │       ├── health/         # System health check
│   │       ├── query/          # NLQ processing
│   │       ├── scenarios/      # Scenario analysis
│   │       ├── product-agent/  # Pattern detection & PRD generation
│   │       └── seed/           # Database seeding
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   └── lib/
│       ├── intelligence/       # AI orchestration
│       │   ├── claude/         # Claude API integration
│       │   ├── nlq/            # Natural language queries
│       │   └── scenarios/      # Scenario calculator
│       ├── data/               # Data layer
│       │   ├── adapters/       # Excel, external APIs
│       │   └── server/         # Server-side data fetchers
│       ├── semantic/           # Financial metric definitions
│       ├── cache/              # In-memory cache manager
│       └── db/                 # Prisma client
├── prisma/
│   └── schema.prisma           # Database schema
├── data/
│   └── intelligence/           # OSINT reports (140 accounts)
├── docs/                       # Documentation
└── tests/                      # E2E tests (Playwright)
```

## Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Required: Anthropic API Key for Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Required: Database URL (SQLite for development)
DATABASE_URL=file:./dev.db

# Required for tests: application base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: News API for OSINT intelligence
NEWSAPI_KEY=...

# Optional: RapidAPI key for company enrichment (all 140 accounts)
RAPIDAPI_KEY=...

# Optional: OpenCorporates API for corporate registry data (directors, legal name, jurisdiction)
OPENCORPORATES_API_KEY=...

# Optional: Extend cache TTLs to 30 min (useful for demos)
DEMO_MODE=true

# Environment
NODE_ENV=development
```

## Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)

# Production
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database

# Testing
npm run test:unit        # Run Vitest unit tests (161 tests)
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run tests with UI
npx playwright test tests/smoke/   # Smoke tests (49 tests)
npx playwright test tests/e2e/     # Full E2E suite
npm run test:unit && npx playwright test  # Run all tests

# Code Quality
npm run lint             # ESLint checks
```

## CI/CD

GitHub Actions runs on every pull request (`.github/workflows/ci.yml`):

- **Type-check**: `tsc --noEmit` across the full codebase
- **Build**: `next build` to catch build-time errors
- **Smoke tests**: Playwright smoke suite (49 tests) against the built app

Merges to `main` trigger an automatic Vercel production deployment.

## Rate Limiting

All routes that call the Claude API enforce in-memory per-IP rate limits:

| Route | Limit |
|-------|-------|
| `/api/query` | 20 req/min |
| `/api/scenarios/analyze` | 10 req/min |
| `/api/product-agent/*` | 10 req/min |
| `/api/accounts/[name]/chat` | 20 req/min |
| `/api/enrich` | 5 req/min |

Rate-limited responses return HTTP 429 with a `Retry-After` header. All API entry points also validate request bodies with Zod schemas before any AI call is made.

## API Endpoints

### Health Check
```bash
GET /api/health
```
Returns system status, adapter health, cache stats, environment config.

### Natural Language Query
```bash
POST /api/query
Content-Type: application/json

{
  "query": "Which customers have ARR over $500K?",
  "filters": { "bu": "Cloudsense" },
  "conversationContext": []
}
```

### Scenario Analysis
```bash
POST /api/scenarios/analyze
Content-Type: application/json

{
  "scenarioType": "pricing_change",
  "targetBU": "Cloudsense",
  "assumptions": {
    "priceIncreasePercent": 10,
    "affectedCustomerPercent": 80,
    "expectedChurnRate": 5
  }
}
```

### Seed Database
```bash
POST /api/seed
```
Loads customer data from Excel budget file into database.

For detailed API documentation, see [docs/api/](docs/api/).

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` (use Turso or Neon for production)
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL)
   - `RAPIDAPI_KEY` (optional — company enrichment)
   - `OPENCORPORATES_API_KEY` (optional — corporate registry)
   - `NEWSAPI_KEY` (optional — news intelligence)
4. Deploy

### Docker

```bash
# Build image
docker build -t skyvera-intelligence .

# Run container
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e DATABASE_URL=file:/app/data/dev.db \
  skyvera-intelligence
```

## Troubleshooting

### Issue: "ANTHROPIC_API_KEY not configured"
**Solution**: Add your Claude API key to `.env.local`. Get one at [console.anthropic.com](https://console.anthropic.com/).

### Issue: "Prisma Client not generated"
**Solution**: Run `npx prisma generate` to generate the Prisma client.

### Issue: "No customers found in database"
**Solution**: Seed the database by running a POST request to `/api/seed` or ensure the Excel file is in the root directory.

### Issue: Database locked errors
**Solution**: SQLite doesn't handle concurrent writes well. For production, use PostgreSQL or Turso (SQLite with better concurrency).

### Issue: Rate limit errors from Claude API
**Solution**: The orchestrator has built-in rate limiting and retry logic. If you see persistent errors, check your API tier limits.

## Accessibility

The platform meets **WCAG 2.2** compliance standards:

- Tab navigation uses `<Link>` components with `aria-current="page"` on active routes
- Named landmark navs, dialog ARIA attributes, and `fieldset`/`legend` grouping throughout
- `prefers-reduced-motion` respected for all animated transitions
- `scroll-margin-top` applied to in-page anchor targets
- Design tokens use OKLCH-aware color palette with sufficient contrast ratios
- Design system documented in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md)

## Documentation

- [API Documentation](docs/api/) - Complete API reference
- [Architecture Guide](docs/architecture.md) - System design and data flow
- [Deployment Guide](docs/deployment.md) - Production deployment
- [Developer Guide](docs/development.md) - Contributing and extending
- [User Guide](docs/user-guide.md) - Feature walkthroughs
- [Product Design Spec](PRODUCT.md) - Design system and component standards
- [Design Tokens](DESIGN.md) - CSS token vars, OKLCH palette, spacing scale

## Key Metrics & Business Context

**Current Portfolio (Q1'26):**
- Total Revenue: $14.7M quarterly
- Recurring Revenue: $12.6M (86% of total)
- Net Margin: 62.5% (target: 68.7%)
- EBITDA: $9.2M
- Customer Count: 140+ enterprise accounts
- Business Units: 3 (Cloudsense $8M, Kandy $3.3M, STL $1M)

**Strategic Priorities:**
1. Improve net margin from 62.5% to 68.7% target (-$918K gap)
2. Reverse RR decline (-$336K vs prior plan)
3. Reduce AR > 90 days from $1.28M
4. Optimize Salesforce UK contract ($4.1M annual cost)

## Issue Tracking

This project uses **beads (`bd`)** for issue tracking. Run `bd prime` in the repo root to see full workflow context and commands.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

## Contributing

This is a private executive intelligence system. For questions or support, contact the development team.

## License

Proprietary - Skyvera Portfolio Company

## Support

For issues or questions:
1. Check [docs/](docs/) for detailed guides
2. Review [Troubleshooting](#troubleshooting) section
3. Contact the engineering team

---

**Built with Claude AI** | **Powered by Next.js** | **Designed for Executives**
