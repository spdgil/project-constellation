# Workflow: Importing a Sector Development Strategy

This document walks through the end-to-end flow for importing a new LGA
sector development strategy into the Constellation Development Facility — from document
upload through to a graded, published strategy record.

---

## Overview

The pipeline has five stages, shown in the workflow indicator at the top
of the draft page:

```
Upload → Extract → Edit → Grade → Publish
```

Each stage is optional except Upload and Publish. You can save a draft at
any point and return later.

---

## 1. Upload Document

**Route:** `/strategies/upload`

**How to get there:** From the Strategies index (`/strategies`), click
**Upload strategy** in the top-right corner.

**Steps:**

1. Optionally enter a **strategy title**. If left blank, the title is
   derived from the filename.
2. Drag-and-drop or click to select a document. Supported formats:
   - PDF (text is extracted via pdfjs-dist on the client)
   - TXT, MD, CSV (read as UTF-8)
   - Max 20 MB
3. The system automatically:
   - **Extracts text** from the document (client-side)
   - **Creates a draft strategy** record (`POST /api/strategies`)
   - **Uploads the source document** binary
     (`POST /api/strategies/:id/documents`)
4. On success you are redirected to the **draft page**
   (`/strategies/:id/draft`).

**Key files:**
- `components/strategies/StrategyUpload.tsx` — upload UI
- `app/strategies/upload/page.tsx` — page wrapper
- `lib/extract-text.ts` — PDF and text extraction
- `app/api/strategies/route.ts` — POST creates the draft record
- `app/api/strategies/[id]/documents/route.ts` — POST stores binary

---

## 2. AI Extraction

**Route:** `/strategies/:id/draft` (same draft page)

If the strategy has extracted text and no blueprint components have been
populated yet, a banner appears:

> *"N words extracted from source document. Run AI extraction to populate
> blueprint components."*

Click **Run AI extraction** to call `POST /api/strategies/extract`.
This sends the full extracted text to GPT-4o, which returns structured
fields aligned to the six-component blueprint:

| Field | Description |
|-------|-------------|
| `title` | Strategy title as stated in the document |
| `summary` | 2–3 sentence summary |
| `components.1–6` | Content for each blueprint component |
| `selectionLogic` | Adjacent/growth definitions + selection criteria |
| `crossCuttingThemes` | Recurring themes across sectors |
| `stakeholderCategories` | Stakeholder taxonomy |
| `prioritySectorNames` | Sector names mentioned in the document |

Each component also receives a **confidence score** (0.0–1.0) and a
**source excerpt** — a short quote from the document justifying the
extraction.

After extraction completes, the draft is **auto-saved** so the extracted
data persists immediately.

**Prompt template:** `prompts/sector_strategy_extraction.md`

**Key files:**
- `app/api/strategies/extract/route.ts` — LLM extraction endpoint
- `components/strategies/StrategyDraft.tsx` — `handleExtract`

---

## 3. Human Editing

**Route:** `/strategies/:id/draft`

After extraction (or for manually created strategies), all fields are
editable:

- **Title and summary** — top section
- **Blueprint components** — side-by-side view:
  - Left panel: AI source excerpt (read-only reference)
  - Right panel: editable textarea
  - Confidence bar with colour coding per component
- **Selection logic** — adjacent definition, growth definition, criteria
- **Cross-cutting themes and stakeholder categories** — one per line
- **Linked sector opportunities** — add/remove/reorder via dropdown
  and list controls

Click **Save draft** at any time to persist changes via
`PATCH /api/strategies/:id`. The "Saved HH:MM:SS" timestamp confirms
the save.

---

## 4. AI Grading

**Route:** `/strategies/:id/draft` (grading section)

Once blueprint components have content, the **Strategy Grade** section
appears. Click **Run AI grading** to:

1. Auto-save the current draft
2. Call `POST /api/strategies/:id/grade`
3. GPT-4o evaluates the strategy against the grading scale (A → F)

The grading result includes:

| Field | Description |
|-------|-------------|
| `grade_letter` | A, A-, B, B-, C, D, or F |
| `grade_rationale_short` | 2–3 sentence rationale |
| `evidence_notes_by_component` | Per-component assessment |
| `missing_elements` | Specific gaps with component ID and reason |
| `scope_discipline_notes` | Whether the strategy stays within scope |

The grade is persisted as a `StrategyGrade` record (upsert). You can
**re-grade** after making edits.

**Prompt template:** `prompts/sector_strategy_grading.md`

**Key files:**
- `app/api/strategies/[id]/grade/route.ts` — LLM grading endpoint
- `components/strategies/StrategyDraft.tsx` — `handleGrade`

---

## 5. Publish

**Route:** `/strategies/:id/draft` → redirects to `/strategies/:id`

Click **Accept and publish** to:

1. Save all current fields including linked sectors
2. Set `status` to `"published"`
3. Redirect to the published strategy detail page

The published strategy:
- Appears in the **Strategies index** (`/strategies`) with its grade
  badge and linked sector count
- Shows the full detail view with priority sectors as clickable links,
  blueprint components, selection logic, cross-cutting themes,
  grade and evidence, and the EDDT visual
- Has an **Edit strategy** link in the header to return to the draft
  page for further edits

---

## Re-editing a Published Strategy

From the strategy detail page (`/strategies/:id`), click **Edit strategy**
to return to the draft page. The strategy remains in `"published"` status
while you edit; changes are saved as drafts. To update the status back
to draft, you would need to change the status field via the API.

---

## Seeded GW3 Example

The seed data includes the **Greater Whitsunday METS Sector Revenue
Diversification Strategy** (`strategy_gw3_mets_diversification`) which
demonstrates the final published state:

- 7 linked sector opportunities
- Grade: A-
- Evidence notes for all 6 blueprint components
- Selection logic with adjacent/growth definitions and 5 criteria
- 4 cross-cutting themes and 7 stakeholder categories

Run `npm run db:seed` to populate the database with this example.

---

## API Endpoints Summary

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/strategies` | Create draft strategy |
| GET | `/api/strategies` | List all strategies |
| GET | `/api/strategies/:id` | Get single strategy |
| PATCH | `/api/strategies/:id` | Update fields + sector links |
| DELETE | `/api/strategies/:id` | Delete strategy |
| POST | `/api/strategies/:id/documents` | Upload source document |
| POST | `/api/strategies/extract` | AI text extraction |
| POST | `/api/strategies/:id/grade` | AI grading |
| GET | `/api/sectors` | List sector opportunities |

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| "No text could be extracted" | The PDF may be image-only. Use a text-based PDF or OCR the document first. |
| Extraction returns low confidence | The source document may not align well with the 6-component blueprint. Edit fields manually. |
| Grading returns unexpected grade | Ensure all 6 components have substantive content before grading. |
| "OPENAI_API_KEY not set" | Set `OPENAI_API_KEY` in `.env.local`. |
| Sector opportunities not in dropdown | Run `npm run db:seed` to populate sector opportunities. |
