# Onboarding — Skyvera Intelligence Platform

Welcome. This doc gets a new engineer productive in the codebase. It is not the end-user
manual (see `docs/user-guide.md` for that) — this is for people writing code here.

Start by reading **`CLAUDE.md`** in the repo root — it's the canonical source of truth for
architecture, conventions, and known gotchas. Everything below is a scannable summary of it
plus the practical workflow you'll actually use day to day.

## What this is

Skyvera is an internal, AI-powered executive intelligence platform for Skyvera the company —
not open source, not customer-facing. It gives leadership a single place to query, model, and
act on financial and account data across three core business units (Cloudsense, Kandy, STL,
plus smaller divisions like NewNet/PeerApp/Mobilogy that sit outside the primary three). It
combines a real budget/customer dataset with a Claude-powered natural-language query engine,
scenario modeling, and per-account "DM strategy" recommendations, all served through a Next.js
app deployed at https://skyvera.vercel.app.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind** for styling, with a token-based design system (see `DESIGN.md`)
- **Prisma** ORM over **SQLite** (`file:./dev.db` locally — see the "surprises" section below)
- **Claude Sonnet** via a single orchestrator singleton for all LLM calls
- **Playwright** (smoke + E2E) and **Vitest** (unit) for testing
- Repo: https://github.com/diamondhholdings-hub/skyvera

## Repo structure at a glance

```
src/app/              Next.js pages + API routes (dashboard, accounts, query, scenario, dm-strategy, alerts)
src/app/api/          22 API routes — query, scenarios, dm-strategy, enrichment, account chat, plan CRUD
src/lib/intelligence/ Claude orchestrator, NLQ engine, scenario calculator, DM strategy engine
src/lib/data/         Excel parser, RapidAPI adapters (x5), server-side fetchers
src/lib/middleware/   In-memory per-IP rate limiter
src/lib/validation/   Zod schemas for API input validation
src/lib/cache/        Cache manager (DEMO_MODE aware)
src/lib/semantic/     Financial metric resolver (ARR, EBITDA, etc.)
data/intelligence/    OSINT reports per account
data/enrichment/      RapidAPI cache, one JSON per account slug
data/account-plans/   strategy/, actions/, stakeholders/ per account
prisma/               SQLite schema (Customer, Subscription, DMRecommendation)
tests/smoke/          Playwright smoke tests — fast, no server needed
tests/e2e/            Playwright E2E — full demo flows, needs a running dev server
tests/unit/           Vitest unit tests — business logic
.github/workflows/    CI: type-check + build + smoke tests on every PR
```

## Getting the dev environment running

Don't duplicate it here — follow **README.md → "Quick Start (5 Minutes)"** for install,
`.env.local` setup, database init/seed, and starting the dev server.

## Issue tracking: bd (beads)

This project tracks all work in **bd**, not GitHub Issues, not TODO comments, not TodoWrite.
Full reference lives in `AGENTS.md` — run `bd prime` in your session for the complete
workflow and the session-close protocol. The four commands you'll use constantly:

```bash
bd ready               # See what's available to work on
bd show <id>           # Read the full detail on an issue
bd update <id> --claim # Claim an issue before starting work on it
bd close <id>          # Mark it done when you're finished
```

As of this writing there are 0 open beads issues — check `bd ready` for current state, it
changes fast.

## Where the real budget data lives

The master financial source is an Excel workbook at the repo root, currently
`2026-07-02 Skyvera - Budget - Q3'26 - Final - For Todd.xlsx` (the filename embeds the quarter
and changes each refresh cycle — check the actual root for the current one, and grep for the
old filename if you're chasing a stale reference in a script). It's parsed into
`src/data/skyvera-snapshot.json`, which the app reads from.

To refresh the snapshot after a new workbook lands:

```bash
npm run refresh-data
```

This runs `scripts/parse_excel_to_json.py --type all` and rewrites the JSON snapshot. A few
other scripts (`extract_dm_data.py`, `inspect_excel.py`) also read the workbook by filename —
if you rename/replace the xlsx, grep the `scripts/` directory for the old filename and update
those references too.

## Test commands

```bash
npm run test:unit                    # Vitest — business logic, adapters, middleware
npx playwright test tests/smoke/     # Playwright smoke — UI behavior, no external APIs
npx playwright test tests/e2e/       # Playwright E2E — full flows, needs `npm run dev` running
```

CI runs type-check + build + smoke tests automatically on every PR (`.github/workflows/ci.yml`).
Currently: `tsc` is at 0 errors, and both unit and smoke suites are fully green.

## Things that will surprise you

- **`arr: customer.rr` in `src/lib/semantic/resolver.ts`** — the field is named `rr` but the
  value stored there is already an annual figure. The `arr` alias exists because of this; it's
  documented, not a bug, but it will confuse you the first time you read it.
- **`aggregateByBU()` in `src/lib/data/adapters/excel/transforms.ts` has zero live callers** —
  it works correctly (fixed 2026-08-05, groups/aggregates by BU as intended), but nothing in the
  app currently invokes it. Fine to use if you need this exact aggregation; just verify it still
  behaves as expected since it's untested by any live code path.
- **SQLite in production on Vercel** — the app runs SQLite (`file:./dev.db`) even in the
  deployed Vercel serverless environment. Vercel's filesystem is ephemeral and serverless
  functions don't share writable state, so this is a real constraint, not just a "fine for now."
  A move to Supabase (Postgres) has been decided but not yet executed — don't assume writes
  persist reliably in prod.
- **The rate limiter is in-memory, per-process** — `src/lib/middleware/rate-limit.ts` tracks
  request counts in memory. On Vercel, each serverless instance (and region) has its own memory,
  so the limiter does **not** enforce a global limit the way the code comments might imply. Treat
  the stated RPM caps (Claude routes 10-20/min, enrich 5/min) as best-effort, not guaranteed.
- **RapidAPI / OpenCorporates degrade gracefully by design** — if `RAPIDAPI_KEY` or
  `OPENCORPORATES_API_KEY` is missing, adapters return `ok({ data: [] })`, not an error, and the
  enrichment pipeline marks those sections `skipped`. If you see empty enrichment data locally,
  check your `.env.local` keys before assuming something's broken.
- **Event handlers are illegal in Server Components** — this codebase leans hard on Server
  Components for data fetching. Interactive bits use CSS `:hover` + a `<style>` tag rather than
  `onClick`/`onMouseEnter` where a Server Component would otherwise need one; only true islands
  are marked `"use client"`.
- **Repo root is noisy** — there are 35+ standalone markdown files at the root (handoff notes,
  session summaries, superseded reports) with overlapping content. `CLAUDE.md`, `README.md`,
  `PRODUCT.md`, and `DESIGN.md` are the ones that matter; treat the rest as historical unless
  told otherwise.
- **No auth, by design** — there is currently no authentication system. This is a deliberate,
  on-hold decision (see `WAITING_ON.md`), not an oversight.
