/**
 * GET /api/sectors — List all sector opportunities.
 * Returns id and name for use in pickers / selectors.
 */

import { NextResponse } from "next/server";
import { loadSectorOpportunities } from "@/lib/db/queries";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const sectors = await loadSectorOpportunities();
    return NextResponse.json(sectors);
  } catch (error) {
    logger.error("GET /api/sectors failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load sector opportunities" },
      { status: 500 },
    );
  }
}
