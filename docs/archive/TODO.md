# Skyvera Intelligence Platform - TODO

## Production Status
- **DEPLOYED**: https://skyvera.vercel.app
- **Repository**: https://github.com/diamondhholdings-hub/skyvera.git
- **Test Coverage**: 210/210 passing (161 unit + 49 smoke)
- **CI/CD**: GitHub Actions on every PR (type-check + build + smoke tests)

---

## Completed (as of 2026-04-06)

### Infrastructure & DevOps
- GitHub Actions CI/CD: `.github/workflows/ci.yml` — type-check, build, smoke tests on every PR
- Health check endpoint at `/api/health`
- Prisma postinstall script for Vercel deployment
- Database indexes (7 strategic indexes across 3 models)

### Quality & Hardening
- React ErrorBoundary: `src/components/ui/error-boundary.tsx` — wraps 3 critical components
- Rate limiting: `src/lib/middleware/rate-limit.ts` — in-memory per-IP, applied to 9 API routes
- Zod input validation: `src/lib/validation/schemas.ts` — applied to all Claude-calling routes
- JSDoc documentation: 10 lib files, ~40 functions (includes full DM waterfall formula)
- ESLint: known ESLint 9 + Next.js circular dependency — TypeScript compiler provides coverage

### Testing
- Unit tests (Vitest): 161/161 passing — `npm run test:unit`
- Smoke tests (Playwright): 49/49 passing — `npx playwright test tests/smoke/`
- Test utilities: `tests/utils/hydration-helpers.ts`, `tests/utils/test-data-fixtures.ts`

### Integrations
- OpenCorporates adapter: `src/lib/data/adapters/external/opencorporates.ts` — directors, legal name, jurisdiction, incorporation date; wired as 6th enrichment adapter
- RapidAPI degraded fix: all 5 adapters return `skipped` (not `error`) when `RAPIDAPI_KEY` is absent
- NewsAPI, RapidAPI x5 enrichment adapters
- Inline status editing for pain points and action items (optimistic + revert)
- Print/PDF export with `@media print` styling

### Code Quality
- TypeScript: 0 errors
- Security audit: 0 vulnerabilities
- Debug code removed from production paths

---

## Pending — Low Priority

### Environment / Ops
- [ ] Add `OPENCORPORATES_API_KEY` to Vercel env vars (when key is available)
- [ ] Add `RAPIDAPI_KEY` to Vercel env vars and run enrichment for all 140 accounts
- [ ] Configure automated database backups
- [ ] Add pre-commit hooks (Husky + lint-staged)

### Security & Auth
- [ ] Authentication system (NextAuth + Google OAuth — deferred by design for demo)
- [ ] Add CSRF protection

### Observability
- [ ] Set up error monitoring (Sentry)
- [ ] Error boundaries on remaining non-critical components

### Performance
- [ ] PostgreSQL/Turso migration (SQLite has concurrency limits in prod)
- [ ] Redis caching for Claude API responses
- [ ] Lighthouse audit and Core Web Vitals optimization
- [ ] API response compression
- [ ] ISR (Incremental Static Regeneration) for frequently accessed pages

### Features
- [ ] Dark mode
- [ ] User preferences/settings page
- [ ] Advanced financial reporting filters
- [ ] Architecture diagram

---

## Test Commands

```bash
# Unit tests (Vitest)
npm run test:unit

# Smoke tests (Playwright)
npx playwright test tests/smoke/
```

---

_Last Updated: 2026-04-06_
