/**
 * GET /api/sectors — List all sector opportunities.
 * Returns id and name for use in pickers / selectors.
 */

import { NextResponse } from "next/server";
import { loadSectorOpportunities } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { rateLimitOrResponse } from "@/lib/api-guards";

/** List all sector opportunities for selectors. */
export async function GET(request: Request) {
  try {
    const rateLimitResponse = await rateLimitOrResponse(
      request,
      "sector-read",
      120,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const sectors = await loadSectorOpportunities();
    return NextResponse.json(sectors, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    logger.error("GET /api/sectors failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load sector opportunities" },
      { status: 500 },
    );
  }
}
