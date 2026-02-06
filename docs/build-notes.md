# Build notes

## Data structure

- **Source of truth:** `lib/types.ts` (ReadinessState, DealStage, Constraint, LGA, OpportunityType, Deal, Cluster, EvidenceRef, Note).
- **Static data:** JSON in `/data`. Loaded at build/request time via `lib/data.ts`:
  - `lgas.json` — LGA records (id, name, geometryRef, summary, opportunityHypotheses, activeDealIds, repeatedConstraints, evidence).
  - `opportunityTypes.json` — Taxonomy (id, name, definition, economicFunction, typicalCapitalStack, typicalRisks).
  - `deals.json` — Deals (id, name, opportunityTypeId, lgaIds, lat?, lng?, stage, readinessState, dominantConstraint, summary, nextStep, evidence, notes, updatedAt).
  - `clusters.json` — Clusters (id, name, opportunityTypeId, lgaIds, readinessState, dominantConstraint, rationale, dealIds).
  - `qld-lga-boundaries.json` — GeoJSON FeatureCollection; each feature has `id` / `properties.id` matching LGA `geometryRef` for map rendering.
- **Enums:** Readiness (6 states), DealStage (5), Constraint (10). Labels in `lib/labels.ts`.

## Mapbox GL (map view)

- **Library:** `react-map-gl` + `mapbox-gl` with Mapbox's `light-v11` monochrome style.
- **Token:** A Mapbox access token is required. Create a free account at [mapbox.com](https://account.mapbox.com/auth/signup/), copy your default public token, and add it to `.env.local`:
  ```
  NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
  ```
  Restart the dev server after setting the token. Without a token, the map displays a helpful setup message instead.
- **LGA boundaries:** Rendered as a GeoJSON `Source` with `fill` and `line` layers. The existing `data/qld-lga-boundaries.json` is used; boundaries are simplified placeholders and should be replaced with accurate geometry for production.
- **Deal markers:** Positioned at `lat`/`lng` from deal data, or at the centroid of the first matching LGA polygon when coordinates are absent.
- **Styling:** Boundary stroke `#2C2C2C`, selected fill `#E8E6E3` at 30% opacity; LGA name labels with white halo. Matches the design system's calm, monochrome palette.

## Local overrides

- **Scope:** Deals only. Stored in `localStorage` under `project-constellation:deals` as a JSON object `Record<dealId, Deal>`.
- **Semantics:** `getDealWithLocalOverrides(id, baseDeal)` and `getDealsWithLocalOverrides(baseDeals)` merge: if a deal id exists in storage, that object is used; otherwise the base deal. No partial merge; the stored deal is the full Deal.
- **Write:** `saveDealLocally(deal)` overwrites the entry for `deal.id`. Constraint changes can be appended via `appendConstraintEvent` (stored under `project-constellation:constraint-events`).
- **Usage:** Map, opportunities index/detail, deals search, and state view call `getDealsWithLocalOverrides(baseDeals)` (or the single-deal variant) so aggregates and lists reflect local edits.

## Adding content

**New LGA**

1. Add a record to `data/lgas.json` (id, name, geometryRef, optional summary, opportunityHypotheses, activeDealIds, repeatedConstraints, evidence).
2. Add a feature to `data/qld-lga-boundaries.json` with the same `id` (or `properties.id`) as `geometryRef`, and a Polygon/MultiPolygon geometry in `[lng, lat]` WGS84.

**New opportunity type**

1. Add a record to `data/opportunityTypes.json` with id, name, definition, economicFunction, typicalCapitalStack, typicalRisks.
2. Ensure id is URL-safe (used in `/opportunities/[id]`).

**New deal**

1. Add a record to `data/deals.json`. Required: id, name, opportunityTypeId (must exist in opportunityTypes), lgaIds (array of LGA ids), stage, readinessState, dominantConstraint, summary, nextStep, evidence (array), notes (array), updatedAt (ISO string). Optional: lat, lng for map marker.
2. Add the deal id to each relevant LGA’s `activeDealIds` in `data/lgas.json` so it appears in LGA panels.

## v2 next steps

- **Database:** Replace static JSON with a DB (e.g. Postgres). Keep `lib/types.ts`; add migrations and a query layer. Run loaders from API routes or server components.
- **Auth:** Add auth (e.g. Auth.js) and protect edit flows. Restrict who can change readiness/constraint and who can add LGAs/deals.
- **Ingestion:** Define pipelines for ingesting deals/LGAs from external sources; validate against types; support incremental updates and audit (constraint events, last updated).
- **Local overrides:** Decide whether v2 keeps browser overrides as a draft layer or moves all edits to the backend with permissions.
