/**
 * GET /api/health
 *
 * Health check endpoint for load balancers and monitoring.
 * Verifies database connectivity and returns service status.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const start = Date.now();

  try {
    // Verify database connectivity with a lightweight query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      db: "connected",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database check failed", { error: String(error) });
    return NextResponse.json(
      {
        status: "degraded",
        db: "disconnected",
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
