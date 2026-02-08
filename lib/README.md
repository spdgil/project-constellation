# Library Overview

This directory contains shared application logic used by API routes, server components,
and client components. Key modules:

- `lib/db`: Database access layer (Prisma client, query mappers).
- `lib/ai`: Prompt builders and parsers for LLM-assisted flows.
- `lib/env`: Environment variable validation (Zod).
- `lib/logger`: Structured logging helper for server + client log forwarding.
- `lib/validations`: Zod schemas for API input validation.
- `lib/types`: Shared domain types (deals, strategies, LGAs).

Data flow conventions:

1. API routes validate input with Zod (`lib/validations`).
2. Server logic uses `lib/db/queries` to fetch and map data.
3. AI routes use `lib/ai/*` to build prompts and parse model output.
4. Client components log warnings/errors via `lib/client-logger`.

