# Seed Data

How seed data flows into Project Constellation.

---

## Architecture

```
External JSON files (snake_case)
        │
        ▼
  scripts/ingest-seeds.ts   ← transform to camelCase
        │
        ▼
  data/sectorOpportunities.json
  data/strategies.json       ← normalised app format
        │
        ▼
  prisma/seed.ts             ← upserts into Postgres
        │
        ▼
  PostgreSQL (via Prisma)
```

The app loads data from Postgres at runtime through `lib/db/queries.ts`.
A parallel set of static loaders in `lib/data.ts` reads the same JSON files
at build time for unit tests and lightweight previews.

---

## Files

| File | Purpose |
|------|---------|
| `data/deals.json` | Deal records (existing) |
| `data/lgas.json` | Local Government Areas (existing) |
| `data/opportunityTypes.json` | Opportunity type definitions (existing) |
| `data/sectorOpportunities.json` | Sector opportunity blueprints |
| `data/strategies.json` | Sector development strategies + grading |
| `prisma/seed.ts` | Reads all `data/*.json` and upserts into Postgres |
| `scripts/ingest-seeds.ts` | Transforms external reference JSONs into app format |

---

## Ingesting new seed data

When you receive updated `SEED_GW3_*.json` files from the research team:

```bash
# 1. Transform external files into data/
npm run seed:ingest -- \
  path/to/SEED_GW3_SECTOR_OPPORTUNITIES.json \
  path/to/SEED_GW3_STRATEGY_RECORD.json

# 2. Push into the local Postgres database
npm run db:seed
```

This is a two-step process so you can inspect the normalised JSONs in `data/`
before committing and seeding.

### Full reset (drop + migrate + seed)

```bash
npm run db:reset
```

---

## External file format

The ingest script expects the reference package format:

**SEED_GW3_SECTOR_OPPORTUNITIES.json** — top-level object:
```json
{
  "version": "2026_02_07",
  "source": "GW3_METS_Revenue_Diversification_Strategy",
  "sector_opportunities": [ { "id": "…", "name": "…", "sections": { "1": "…" } } ]
}
```

**SEED_GW3_STRATEGY_RECORD.json** — top-level object:
```json
{
  "version": "2026_02_07",
  "strategy": { "id": "…", "title": "…", "priority_sectors": [] },
  "grading": { "strategy_id": "…", "grade_letter": "A_minus" }
}
```

The ingest script converts `snake_case` keys to `camelCase` and flattens the
envelope, producing the arrays that `prisma/seed.ts` expects.

---

## Adding a new seed entity type

1. Add a JSON file under `data/` following the camelCase convention.
2. Add a typed loader in `lib/data.ts`.
3. Add the upsert logic to `prisma/seed.ts`.
4. If the data comes from an external package, extend `scripts/ingest-seeds.ts`
   with a new transformer.
5. Add Prisma query functions in `lib/db/queries.ts` for runtime access.

---

## npm scripts reference

| Script | Description |
|--------|-------------|
| `npm run seed:ingest -- <opportunities.json> <strategy.json>` | Transform external JSONs → `data/` |
| `npm run db:seed` | Upsert `data/*.json` into Postgres |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:reset` | Drop DB, re-migrate, and re-seed |
