/**
 * POST /api/log
 *
 * Accepts client-side log entries and forwards them to the server logger.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { readJsonWithLimit } from "@/lib/request-utils";

interface LogBody {
  level: "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
  source?: string;
}

export async function POST(request: Request) {
  const rlKey = rateLimitKeyFromRequest(request);
  const rl = await checkRateLimit(`client-log:${rlKey}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const parsed = await readJsonWithLimit<LogBody>(request, 10_240);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status ?? 400 },
      );
    }
    const body = parsed.data!;

    if (!body.level || !body.message) {
      return NextResponse.json(
        { error: "level and message are required" },
        { status: 400 },
      );
    }
    if (!["info", "warn", "error"].includes(body.level)) {
      return NextResponse.json(
        { error: "Invalid log level" },
        { status: 400 },
      );
    }

    const payload = {
      source: body.source ?? "client",
      ...sanitizeContext(body.context),
    };

    if (body.level === "error") {
      logger.error(body.message, payload);
    } else if (body.level === "warn") {
      logger.warn(body.message, payload);
    } else {
      logger.info(body.message, payload);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("POST /api/log failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}

function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> {
  if (!context || typeof context !== "object") return {};
  const entries = Object.entries(context).slice(0, 20);
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    if (typeof key !== "string") continue;
    if (typeof value === "string") {
      sanitized[key] = value.slice(0, 500);
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else {
      sanitized[key] = String(value).slice(0, 500);
    }
  }
  return sanitized;
}
