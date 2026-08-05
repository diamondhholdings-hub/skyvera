# Security

Internal document for the Skyvera executive intelligence platform. This is a **private, internal
business tool** — not open source. There is no public disclosure program; this file exists so
anyone working on the codebase knows the current security posture and what's still outstanding.

Last updated: 2026-08-05

## Secrets & API Keys

All secrets live in `.env.local` (git-ignored) and are mirrored in Vercel's environment variable
store for the deployed app. `.gitignore` already covers `.env`, `.env.local`, and `.env*.local` —
verify this before adding any new env file pattern.

Keys in current use: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `RAPIDAPI_KEY`,
`OPENCORPORATES_API_KEY`, `NEXT_PUBLIC_APP_URL`, plus optional `NEWSAPI_KEY` and `DEMO_MODE`.

Rules:
- Never commit a real key, even temporarily, even in a throwaway script or test fixture.
- Never paste a live key into a PR description, commit message, issue tracker, or chat log.
- If a key is ever accidentally committed, rotate it immediately — do not just delete it in a
  follow-up commit (it stays in git history).
- Degraded-mode adapters (RapidAPI, OpenCorporates) are designed to fail safe: a missing key
  returns `ok({ data: [] })`, not an error, so an accidental key removal in production degrades
  functionality rather than crashing the app. Do not "fix" this by hardcoding a fallback key.

## Known Outstanding Security Items

These are real, currently-open gaps. They are tracked here so they aren't forgotten, not because
they're acceptable long-term.

**npm audit — 14 vulnerabilities (1 critical, 11 high, 1 moderate, 1 low).** Not yet triaged.
Run `npm audit` for current detail before every dependency bump, and prioritize triaging the
critical/high findings — this app handles real financial data (revenue, EBITDA, margin, AR aging
across all three BUs), so a dependency compromise has real business impact, not just a demo risk.

**No authentication system.** This is a deliberate, on-hold design decision (see `WAITING_ON.md`),
not an oversight — but it means anyone with the deployed URL can read live financial data with no
login. Do not treat the absence of auth as "fine to leave forever"; revisit before any wider
distribution of the URL beyond the current internal audience.

**Rate limiter is in-memory, per-process.** `src/lib/middleware/rate-limit.ts` implements a
sliding-window limiter per IP, but on Vercel serverless each invocation can land on a different
instance/region with its own memory — so the real effective limit across the deployment is
significantly weaker than the per-instance numbers in the code comments suggest. Don't rely on it
as a hard ceiling (e.g., for cost control on Claude API spend); it's a soft, best-effort guard.

**SQLite in production on Vercel serverless.** `DATABASE_URL` currently points at a local SQLite
file (`file:./dev.db`) even in the deployed app. Vercel's serverless filesystem is ephemeral and
functions can run concurrently, so concurrent writes are a real corruption/data-loss risk, and
anything written can vanish on redeploy or cold start. A Supabase (Postgres) migration has been
decided but not yet executed — treat any write path against the current DB as best-effort until
that migration lands.

## What's Handled Reasonably Today

- Zod validation at all API entry points (400 + issues array on malformed input).
- Result-type error handling at data boundaries — no uncaught exceptions leaking stack traces.
- External adapters (RapidAPI, OpenCorporates) degrade gracefully rather than blocking the
  pipeline or throwing when a key is absent or the service errors.
- No error monitoring (e.g. Sentry) is configured yet — failures in production are only visible
  via Vercel logs, not proactively surfaced. Keep this in mind when debugging "it worked locally."

## If You Find a Security Issue

This is a small internal tool, so the process is simple:

1. **Do not** open a public GitHub issue describing the vulnerability in detail, and do not post
   exploit details anywhere outside a direct message to the project owner.
2. Notify **Todd Ramsey** (todd.ramsey@prytaneumpartners.com) directly, as soon as you find it.
3. Treat it as high priority — this platform surfaces real quarterly revenue, EBITDA, margin, and
   customer-level financial data for all three business units, so even a "minor" leak (e.g. an
   unauthenticated API route returning more than intended) is a real business exposure, not just
   a demo bug.
4. If the issue involves a leaked credential, rotate it immediately (see Secrets section above)
   rather than waiting for a fix to be reviewed and merged.
