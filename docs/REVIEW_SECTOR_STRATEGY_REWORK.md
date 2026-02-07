# Technical Inventory & Final Review — Sector Strategy Rework

Review date: 2026-02-07

---

## 1. Tech stack, framework, routing, data layer

| Layer | Technology | Notes |
| --- | --- | --- |
| Framework | Next.js 16.1.6 (App Router) | Turbopack dev server |
| Language | TypeScript (strict) | |
| UI | React 19, Tailwind CSS, Radix primitives | Design system in `DESIGN_SYSTEM.md` |
| State | Server components default; client components where interactive (`"use client"`) | No Zustand or React Query yet |
| ORM | Prisma 7.3 with `@prisma/adapter-pg` | Schema in `prisma/schema.prisma` |
| Database | PostgreSQL | Connection via `DATABASE_URL` env var |
| AI | OpenAI `gpt-4o` (via `openai` SDK v6) | Used in memo analysis, strategy extraction, strategy grading |
| Maps | Mapbox GL JS + `react-map-gl` | Geocoding via Mapbox v6 API |
| PDF | `pdfjs-dist` | Client-side text extraction |
| Testing | Vitest + React Testing Library | 245 tests across 25 files |
| Routing | File-based App Router (`/app`) | `page.tsx` per route |
| Data loading | Server-side `loadPageData()` / `loadPageDataWithStrategies()` calls Prisma queries in parallel | Returns `{ lgas, deals, opportunityTypes, strategies?, sectorOpportunities? }` |

### All routes

| Route | Purpose |
| --- | --- |
| `/` | Home — Overview + Map tabs (`HomeView` client component) |
| `/deals` | Deal listing with search |
| `/deals/[id]` | Deal detail page |
| `/deals/memo` | Investment Memo upload + AI deal creation |
| `/opportunities` | Opportunity type index |
| `/opportunities/[id]` | Opportunity type detail |
| `/sectors` | **NEW** — Sector Opportunities index with search and tag filters |
| `/sectors/[id]` | **NEW** — Sector Opportunity detail (10 sections) |
| `/strategies` | **NEW** — Strategies index with draft/published badges and grade badges |
| `/strategies/[id]` | **NEW** — Strategy detail with grade, linked sectors, blueprint components |
| `/strategies/[id]/draft` | **NEW** — Strategy draft review/edit page with workflow steps |
| `/strategies/upload` | **NEW** — Strategy document upload page |
| `/about` | Static about page |
| `/api/deals` | GET/POST deals |
| `/api/deals/[id]` | PATCH/DELETE single deal |
| `/api/deals/analyse-memo` | POST — AI memo analysis |
| `/api/strategies` | **NEW** — GET/POST strategies |
| `/api/strategies/[id]` | **NEW** — GET/PATCH/DELETE single strategy |
| `/api/strategies/[id]/documents` | **NEW** — GET/POST strategy documents |
| `/api/strategies/[id]/grade` | **NEW** — POST AI grading |
| `/api/strategies/extract` | **NEW** — POST AI extraction |
| `/api/sectors` | **NEW** — GET all sector opportunities |
| `/api/geocode` | POST — Mapbox geocoding proxy |
| `/api/boundaries` | GET — GeoJSON LGA boundaries |

---

## 2. Existing document upload workflow (unchanged)

The deal-from-document workflow is the original upload path and remains fully intact.

### Files involved

| File | Role |
| --- | --- |
| `app/deals/memo/page.tsx` | Page — server component; loads data, renders `InvestmentMemo` |
| `components/deals/InvestmentMemo.tsx` | UI — file upload, text extraction, AI call, draft form, geocoding, deal creation |
| `lib/extract-text.ts` | Utility — extracts text from PDF (pdfjs-dist) and plain text files |
| `app/api/deals/analyse-memo/route.ts` | API — builds prompts, calls GPT-4o, validates/normalises response |
| `app/api/deals/route.ts` | API — POST handler creates deal in Prisma |
| `app/api/geocode/route.ts` | API — proxies Mapbox Geocoding API |
| `lib/types.ts` | Types — `MemoAnalysisResult`, `Deal`, `OpportunityType`, `LGA` interfaces |
| `lib/db/enum-maps.ts` | Utility — maps kebab-case frontend enums to Prisma underscore enums |
| `components/deals/InvestmentMemo.test.tsx` | Test — 11 tests for the upload component |
| `app/api/deals/analyse-memo/route.test.ts` | Test — 9 tests for the AI analysis endpoint |

---

## 3. Entity models — current state

### Prisma models

| Model | Table | Purpose | Status |
| --- | --- | --- | --- |
| `Lga` | `lgas` | Local Government Area | Existing |
| `LgaOpportunityHypothesis` | `lga_opportunity_hypotheses` | Per-LGA sector hypothesis | Existing |
| `LgaEvidence` | `lga_evidence` | Evidence references for LGAs | Existing |
| `OpportunityType` | `opportunity_types` | Sector taxonomy item | Existing |
| `Deal` | `deals` | Project instance — core pipeline entity | Existing |
| `DealLga` | `deal_lgas` | Many-to-many: Deal ↔ LGA | Existing |
| `DealEvidence` | `deal_evidence` | Evidence references per deal | Existing |
| `DealNote` | `deal_notes` | Timestamped notes per deal | Existing |
| `DealGateEntry` | `deal_gate_entries` | Gate checklist per stage | Existing |
| `DealArtefact` | `deal_artefacts` | Document/artefact tracking | Existing |
| `DealGovernmentProgram` | `deal_government_programs` | Government program references | Existing |
| `DealTimelineMilestone` | `deal_timeline_milestones` | Timeline milestones | Existing |
| `DealDocument` | `deal_documents` | Attached binary documents | Existing |
| `ConstraintEvent` | `constraint_events` | Audit log of constraint changes | Existing |
| **`SectorOpportunity`** | `sector_opportunities` | 10-section reference document with tags | **NEW** |
| **`SectorDevelopmentStrategy`** | `sector_development_strategies` | 6-component blueprint strategy | **NEW** |
| **`StrategyDocument`** | `strategy_documents` | Attached strategy files | **NEW** |
| **`StrategySectorOpportunity`** | `strategy_sector_opportunities` | Many-to-many: Strategy ↔ SectorOpportunity | **NEW** |
| **`StrategyGrade`** | `strategy_grades` | AI-generated letter grade + evidence notes | **NEW** |

---

## 4. Seed data

| File | Entity | Records |
| --- | --- | --- |
| `data/opportunityTypes.json` | `OpportunityType` | 7 |
| `data/lgas.json` | `Lga` | 77 |
| `data/deals.json` | `Deal` | 11 |
| `data/sectorOpportunities.json` | `SectorOpportunity` | **7** (GW3 priority sectors) |
| `data/strategies.json` | `SectorDevelopmentStrategy` | **1** (GW3 METS diversification) |
| `data/strategyGrades.json` | `StrategyGrade` | **1** |
| `data/qld-lga-boundaries.json` | GeoJSON | 77 features |

---

## 5. Completed checklist

### Data models

- [x] `SectorOpportunity` model — 10 sections, tags, sources, Zod-like validation
- [x] `SectorDevelopmentStrategy` model — 6 components, selection logic, cross-cutting themes, stakeholders, status (draft/published), extracted text
- [x] `StrategyGrade` model — grade letter (A through F), rationale, evidence per component, missing elements, scope discipline notes
- [x] `StrategySectorOpportunity` join table — many-to-many with sort order
- [x] `StrategyDocument` model — binary file storage
- [x] TypeScript types in `lib/types.ts` for all new entities
- [x] Prisma migration: `prisma/migrations/20260207_add_strategy_upload/migration.sql`
- [x] Enum maps: `GradeLetter` bidirectional mapping in `lib/db/enum-maps.ts`

### Seed data

- [x] `data/sectorOpportunities.json` — 7 GW3 sector opportunity records with all 10 sections
- [x] `data/strategies.json` — GW3 METS diversification strategy with full metadata
- [x] `data/strategyGrades.json` — GW3 grading record (A-)
- [x] Seed ingestion script: `scripts/ingest-seeds.ts`
- [x] Database seeder: `prisma/seed.ts` updated for new entities
- [x] Documentation: `docs/SEED_DATA.md`

### Navigation and pages

- [x] Global nav updated: "Sectors" and "Strategies" links in `Header.tsx`
- [x] `/sectors` — Sector Opportunities index with search and tag filters
- [x] `/sectors/[id]` — Sector Opportunity detail (renders all 10 sections)
- [x] `/strategies` — Strategies index with status badges, grade badges, upload button
- [x] `/strategies/[id]` — Strategy detail with grade display, linked sectors, blueprint components, "Edit strategy" link
- [x] `/strategies/upload` — Strategy document upload page
- [x] `/strategies/[id]/draft` — Strategy draft review/edit with workflow steps

### Strategy upload flow

- [x] File upload (PDF/doc) via drag-and-drop or picker
- [x] Client-side text extraction using `pdfjs-dist` (reuses `lib/extract-text.ts`)
- [x] Draft strategy creation via `POST /api/strategies`
- [x] Document storage via `POST /api/strategies/:id/documents`
- [x] Redirect to draft page after upload

### AI extraction

- [x] `POST /api/strategies/extract` — GPT-4o extraction of blueprint components
- [x] Strict JSON output matching `StrategyExtractionResult` schema
- [x] Confidence field per component (0–1), clamped in validation
- [x] Source excerpt per component for side-by-side review
- [x] Prompt template: `prompts/sector_strategy_extraction.md`
- [x] Side-by-side UI: source text left, extracted fields right with editable controls
- [x] Auto-save after extraction completes

### AI grading

- [x] `POST /api/strategies/:id/grade` — GPT-4o grading against 6-component blueprint
- [x] Strict JSON output matching `StrategyGrade` schema
- [x] Grade letter, rationale, evidence per component, missing elements, scope discipline notes
- [x] Prompt template: `prompts/sector_strategy_grading.md`
- [x] Grade display on strategy detail page with badge, rationale, evidence accordion
- [x] Grade triggered from both draft page and published detail page

### Strategy ↔ Sector Opportunity linkage

- [x] Many-to-many via `StrategySectorOpportunity` join table with sort order
- [x] Strategy detail page shows linked sectors with clickable links to `/sectors/:id`
- [x] Draft page has editable sector link UI (add, remove, reorder)
- [x] GW3 seeded strategy shows its 7 linked sectors

### End-to-end workflow

- [x] Visual 5-step workflow indicator: Upload → Extract → Edit → Grade → Publish
- [x] Auto-save after AI extraction
- [x] "Edit strategy" link on published strategy detail page
- [x] Workflow documentation: `docs/WORKFLOW_STRATEGY_UPLOAD.md`

### Safeguards and quality

- [x] **Deal features intact**: All 91 deal-related tests pass (InvestmentMemo, DealDetail, DealHero, DealSidebar, DealDrawer, DealsSearch, DealsAnalysis, analyse-memo API, deals-search, deal-storage)
- [x] **No regressions**: Full test suite: 245 tests across 25 files — all passing
- [x] **TypeScript clean**: `tsc --noEmit` passes (only pre-existing `MapCanvas.test.tsx` issues)
- [x] **AI extraction validation**: Runtime validation with fallback defaults and `warnings[]` array returned to client
- [x] **AI grading validation**: Runtime validation with fallback defaults and `warnings[]` array returned to client
- [x] **User-facing warnings**: Amber warning banners in UI when AI response used defaults (extraction and grading)
- [x] **Strategy extraction smoke tests**: 8 tests covering success, missing fields, invalid JSON, markdown fences, truncation, confidence clamping (`app/api/strategies/extract/route.test.ts`)
- [x] **Strategy grading smoke tests**: 5 tests covering 404, empty components, valid grading, malformed AI response, invalid JSON (`app/api/strategies/[id]/grade/route.test.ts`)
- [x] **GW3 seed rendering tests**: 11 additional tests verifying strategy title, summary, type, source document, selection logic, cross-cutting themes, stakeholders, grading evidence for all 6 components, scope discipline notes, sector linkage, section content (`lib/data-seed.test.ts`)

### Test files — new

| File | Tests | Coverage |
| --- | --- | --- |
| `app/api/strategies/extract/route.test.ts` | 8 | Extraction API: 400, success, warnings, fallbacks, 502, fences, truncation, clamping |
| `app/api/strategies/[id]/grade/route.test.ts` | 5 | Grading API: 404, 400, success, warnings/defaults, 502 |
| `lib/data-seed.test.ts` (expanded) | 33 | All seed data + GW3 rendering completeness (was 21, now 33) |

### Documentation

- [x] `docs/REVIEW_SECTOR_STRATEGY_REWORK.md` — this file (technical inventory + checklist)
- [x] `docs/SEED_DATA.md` — seed data loading and update guide
- [x] `docs/WORKFLOW_STRATEGY_UPLOAD.md` — end-to-end strategy import walkthrough
- [x] `prompts/sector_strategy_extraction.md` — LLM prompt template for extraction
- [x] `prompts/sector_strategy_grading.md` — LLM prompt template for grading

---

## 6. Known pre-existing issues (not introduced by this work)

| Issue | File | Notes |
| --- | --- | --- |
| `TS2304: Cannot find name 'afterAll'` | `components/map/MapCanvas.test.tsx` | Missing vitest type import |
| `TS2552: Cannot find name 'MapMouseEvent'` | `components/map/MapCanvas.test.tsx` | Missing type from react-map-gl |
| `act()` warnings in DealDetail tests | `components/deals/DealDetail.test.tsx` | Non-blocking; state updates not wrapped in act() |
