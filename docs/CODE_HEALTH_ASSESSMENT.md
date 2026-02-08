# Code Health Assessment

Assessment date: 2026-02-07. Codebase: Constellation Development Facility (Next.js 16, Prisma, Auth.js, Vercel Blob).

---

## 1. Security & Reliability

**Grade: B**

### Findings

| Issue | Location | Severity |
|-------|----------|----------|
| CSP allows `'unsafe-eval'` and `'unsafe-inline'` for scripts | `next.config.ts:18-19` | Medium — documented as required by Mapbox GL; weakens XSS protection |
| Rate limiter is in-memory; ineffective on Vercel serverless (per-invocation cold start) | `lib/rate-limit.ts:11` | Medium — AI endpoints can be hammered across instances |
| Client components still use `console.error` instead of structured logger | `components/deals/DealDetail.tsx:107,147,165,208`; `DealDrawer.tsx:158`; `InvestmentMemo.tsx:426,430,507`; `useBoundaries.ts:43`; `StrategyUpload.tsx:92` | Low — inconsistent observability in production |
| MapCanvas reads `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` directly (client) | `components/map/MapCanvas.tsx:63` | Low — acceptable for public token; env module is server-only |
| Sentry/Next config read `process.env` directly | `next.config.ts:44-48`; `sentry.*.config.ts:9,13`; `instrumentation.ts:7,11`; `lib/db/prisma.ts:21,27` | Low — build/runtime config; not user-facing |
| Seed script uses `process.env.DATABASE_URL!` and `@ts-nocheck` | `prisma/seed.ts:15`, file header | Low — script-only; no validation at seed time |
| `.env.local` is gitignored; no secrets in repo | `.gitignore:16-20` | Good |
| API routes use Zod or explicit checks for critical inputs; file uploads validated | `lib/validations.ts`; deal/strategy routes | Good |
| Auth optional when `AUTH_SECRET` unset; session endpoint returns null | `lib/auth.ts` | Good |

### Recommendations (priority)

1. **High:** Add distributed rate limiting (e.g. `@upstash/ratelimit` + Vercel KV) for AI routes so limits apply across serverless instances.
2. **Medium:** Replace remaining `console.error`/`console.warn` in client components with a client-safe logger or forward to an error-reporting API.
3. **Medium:** Re-evaluate CSP: test whether Mapbox GL v3 can run with nonce-based script/style or stricter directives; document if `unsafe-eval` must stay.
4. **Low:** Use validated env (or a build-time schema) for Sentry/Next config where possible; keep seed script as-is but add a one-line check for `DATABASE_URL` before running.

---

## 2. Correctness

**Grade: B−**

### Findings

| Issue | Location | Severity |
|-------|----------|----------|
| Pre-existing TypeScript errors in MapCanvas.test.tsx | `components/map/MapCanvas.test.tsx:115` (`afterAll`), `231,235,258,261` (`MapMouseEvent`) | Medium — pre-commit excludes file; test refactor pending (see historical-context.mdc) |
| Dead code: `getDocumentData()` in queries.ts | `lib/db/queries.ts:281-294` | Low — download now redirects to blob URL; function unused |
| Strategy and opportunity-type APIs use ad-hoc validation instead of Zod | `app/api/strategies/route.ts:34-40`; `app/api/strategies/[id]/route.ts:67`; `app/api/opportunity-types/route.ts:35-41` | Low — manual checks; no shared schema or coercion rules |
| PatchStrategyBody / CreateStrategyBody / CreateOpportunityTypeBody are inline types | `app/api/strategies/route.ts`, `[id]/route.ts`, `opportunity-types/route.ts` | Low — duplication and drift risk vs Zod schemas |
| `lib/data.ts` JSON loaders only used by tests (e.g. data-seed.test.ts) | `lib/data.ts`; `lib/data-seed.test.ts` | Low — legacy; boundaries route now uses direct JSON import |
| Prisma/DB layer uses `as never` for enum mapping in several places | e.g. `app/api/deals/route.ts:53-55` | Low — type escape; enums are validated by Zod before mapping |

### Recommendations (priority)

1. **High:** Fix MapCanvas.test.tsx: add Vitest globals (`afterAll`) and correct `MapMouseEvent` type (e.g. from `react-map-gl` or a test double) so the file is included in type-check and pre-commit.
2. **Medium:** Remove or repurpose `getDocumentData()` from `lib/db/queries.ts`; document download is blob redirect only.
3. **Medium:** Introduce Zod schemas for strategy create/patch and opportunity-type create; use `safeParse` in routes and share types with frontend/tests.
4. **Low:** Consider deprecating or clearly marking `lib/data.ts` as test/legacy; ensure no production path depends on it.

---

## 3. Performance

**Grade: B**

### Findings

| Issue | Location | Severity |
|-------|----------|----------|
| No explicit caching on server data loaders (e.g. loadDeals, loadLgas) | `lib/db/queries.ts`; `lib/load-page-data.ts` | Low — Next.js and DB handle reuse; add cache if needed |
| Home and list pages load full deal/LGA sets; no pagination | `app/page.tsx`; `lib/load-page-data.ts` | Low — acceptable for current dataset size; revisit if lists grow |
| Boundaries served from bundled JSON with 1h cache | `app/api/boundaries/route.ts` | Good |
| Prisma queries use `include` for relations; single round-trips per entity type | `lib/db/queries.ts` (DEAL_INCLUDE, STRATEGY_INCLUDE) | Good |
| Health check uses minimal `$queryRaw\`SELECT 1\`` | `app/api/health/route.ts:17` | Good |
| Map and heavy client components not obviously code-split beyond route chunks | e.g. `MapCanvas`, `DealDrawer` | Low — Next already splits by route; monitor bundle if needed |

### Recommendations (priority)

1. **Medium:** If deal/LGA lists grow, add cursor- or page-based pagination to list APIs and pages; keep home summary lightweight.
2. **Low:** Add `revalidate` or cache headers for key server data (e.g. opportunity types, sector list) if they change rarely.
3. **Low:** Consider dynamic import for map-heavy or PDF-heavy components if bundle size becomes an issue.

---

## 4. Maintainability

**Grade: B+**

### Findings

| Issue | Location | Severity |
|-------|----------|----------|
| Cursor rules and historical-context.mdc document pitfalls and workarounds | `.cursor/rules/`; `historical-context.mdc` | Good |
| Domain docs in repo (PRD, design system, seed data, workflows) | `docs/`; root `*.md` | Good |
| Centralised validation and enum schemas | `lib/validations.ts`; `lib/db/enum-maps.ts` | Good |
| Some API handlers are long (e.g. analyse-memo, strategy grade/extract) | `app/api/deals/analyse-memo/route.ts`; `app/api/strategies/[id]/grade/route.ts` | Low — could extract prompts and parsing into lib modules |
| Inline types for strategy/opportunity-type request bodies | `app/api/strategies/route.ts`; `opportunity-types/route.ts` | Low — move to shared types or Zod schemas |
| JSDoc on key modules (e.g. validations, logger, blob-storage, rate-limit) | Various `lib/*.ts` | Good |
| README has tech stack, setup, env vars, and deployment | `README.md` | Good |

### Recommendations (priority)

1. **Medium:** Extract AI prompt construction and response parsing from analyse-memo, strategy extract, and strategy grade into `lib/` (e.g. `lib/ai/memo-analysis.ts`, `lib/ai/strategy-extract.ts`, `lib/ai/strategy-grade.ts`) to shorten route files and improve testability.
2. **Low:** Add a short module README for `lib/db/` and `lib/` describing data flow and where validation/schemas live.
3. **Low:** Align strategy and opportunity-type APIs with the same Zod-based pattern as deals for consistency.

---

## 5. Quality Assurance

**Grade: B**

### Findings

| Issue | Location | Severity |
|-------|----------|----------|
| MapCanvas.test.tsx excluded from type-check due to errors | `.husky/pre-commit`; `historical-context.mdc` | Medium — reduces type-safety and refactor safety for that test |
| No dedicated e2e or Playwright tests referenced in repo | — | Low — CI runs unit/integration tests only |
| A11y: skip link, focus-visible, aria-* present across layout and key components | `app/layout.tsx`; `Header.tsx`; multiple components | Good |
| Vitest + RTL used; 23 test files, 236 tests | `vitest.config.ts`; `tests/setup.ts` | Good |
| ResizeObserver polyfill for jsdom | `tests/setup.ts` | Good |
| Test env vars (DATABASE_URL, OPENAI_API_KEY) in vitest.config | `vitest.config.ts` | Good |
| No automated a11y checks (e.g. axe) in CI | `.github/workflows/ci.yml` | Low — add for critical flows |

### Recommendations (priority)

1. **High:** Fix MapCanvas.test.tsx types and remove its exclusion from pre-commit type-check so the full suite is type-safe.
2. **Medium:** Add one or two e2e tests for critical paths (e.g. load home, open a deal, sign-in when auth is configured) using Playwright or similar.
3. **Medium:** Run axe (or similar) in CI on a static export or key routes to guard against a11y regressions.
4. **Low:** Add a minimal smoke test that hits `/api/health` and optionally `/api/deals` to verify server and DB in CI.

---

## Overall Grade: **B**

The codebase is in good shape for production with clear structure, validation on critical paths, auth and blob storage in place, and useful documentation. The main gaps are: (1) rate limiting that works across serverless instances, (2) fixing MapCanvas.test.tsx and removing type-check exclusion, (3) consistent Zod-based validation and shared types for strategies and opportunity types, and (4) stronger observability (client logging) and optional a11y/e2e checks in CI.

---

## Top 12 Action Items

1. **Fix MapCanvas.test.tsx** — Add Vitest globals and correct `MapMouseEvent` usage; remove file from type-check exclusion in pre-commit.
2. **Distributed rate limiting** — Use @upstash/ratelimit (or similar) with Vercel KV for AI routes so limits apply across all serverless invocations.
3. **Remove dead `getDocumentData()`** — Delete or repurpose in `lib/db/queries.ts`; document downloads use blob redirect only.
4. **Zod schemas for strategies and opportunity types** — Introduce CreateStrategySchema, PatchStrategySchema, CreateOpportunityTypeSchema in `lib/validations.ts` and use in API routes.
5. **Replace client console.error/warn** — Use a small client logger or report-to-api so production errors are observable; align with `lib/logger.ts` where possible.
6. **Extract AI logic to lib** — Move prompt building and response parsing for analyse-memo, strategy extract, and strategy grade into `lib/ai/` (or similar) to shorten routes and improve testability.
7. **CSP review** — Verify if Mapbox GL can run without `unsafe-eval`; if not, keep and document; consider nonces for scripts/styles where feasible.
8. **E2E smoke tests** — Add Playwright (or similar) for home page and one deal flow; run in CI.
9. **A11y in CI** — Add axe (or similar) on key routes in the GitHub Actions workflow.
10. **Pagination** — If deal/LGA lists grow, add pagination to list APIs and list pages.
11. **Legacy lib/data.ts** — Mark as test/legacy or remove unused JSON loaders; ensure no production code path uses it.
12. **Module READMEs** — Add brief `lib/README.md` and `lib/db/README.md` describing data flow, validation, and where schemas live.
