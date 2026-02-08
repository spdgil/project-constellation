# Database Layer

This folder encapsulates all Prisma access and mapping logic.

## Key Files

- `prisma.ts`: Singleton Prisma client with env validation.
- `queries.ts`: Typed query functions and mappers used by server components and APIs.
- `enum-maps.ts`: Translation between DB enums and UI labels.

## Conventions

- Keep Prisma access centralized here (avoid direct `prisma.*` calls in components).
- Map DB records to domain types in `queries.ts` before returning to callers.
- When adding fields:
  - Update Prisma schema + migrations
  - Update `queries.ts` mappers
  - Update domain types in `lib/types`

