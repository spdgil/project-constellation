# The Constellation Development Facility

Queensland state-level dashboard that surfaces market-grounded opportunity patterns by LGA, tracks real deals as a maturation pipeline, and supports a project development facility to close the investability gap.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Database:** PostgreSQL via Prisma ORM (Neon in production)
- **Auth:** Auth.js v5 (Google OAuth)
- **Storage:** Vercel Blob (document uploads)
- **AI:** OpenAI GPT-4o (investment memo analysis, strategy extraction/grading)
- **Maps:** Mapbox GL JS v3
- **Styling:** Tailwind CSS v4
- **Monitoring:** Sentry (error tracking)
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Neon)
- Google OAuth credentials (for auth)

### Setup

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.local.example .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

See [`.env.local.example`](.env.local.example) for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js session encryption secret |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public access token |
| `OPENAI_API_KEY` | For AI features | OpenAI API key |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob storage token |
| `SENTRY_DSN` | For monitoring | Sentry data source name |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests (single run) |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed database from JSON files |
| `npm run db:reset` | Reset database and re-seed |

## Deployment (Vercel)

1. Connect the repo to Vercel
2. Set all environment variables in the Vercel dashboard
3. Build command is pre-configured: `prisma generate && prisma migrate deploy && next build`
4. Set `NEXTAUTH_URL` to the production domain

## Docs

- **[PRD](PRD_Project_Constellation.md)** — product requirements and prototype scope
- **[Design system](DESIGN_SYSTEM.md)** — design language (source of truth)
- **[Narrative](narrative_Project_Constellation.md)** — About page and living context
- **[Cursor build guide](README_CURSOR_Project_Constellation.md)** — build order and approach
- **[Seed data](docs/SEED_DATA.md)** — data sources and seeding process

## License

TBD.
