import { NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/lib/auth";
import { checkRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { readJsonWithLimit } from "@/lib/request-utils";

export async function requireAuthOrResponse(): Promise<NextResponse | null> {
  if (!isAuthConfigured) {
    return NextResponse.json(
      { error: "Authentication is not configured" },
      { status: 503 },
    );
  }
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Require an authenticated admin user. Returns a 403 response if the user
 * is not an admin, or delegates to requireAuthOrResponse for 401/503.
 */
export async function requireAdminOrResponse(): Promise<NextResponse | null> {
  const authErr = await requireAuthOrResponse();
  if (authErr) return authErr;

  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function rateLimitOrResponse(
  request: Request,
  keyPrefix: string,
  maxRequests: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const rlKey = rateLimitKeyFromRequest(request);
  const rl = await checkRateLimit(`${keyPrefix}:${rlKey}`, maxRequests, windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }
  return null;
}

export async function readJsonWithLimitOrResponse<T>(
  request: Request,
  maxBytes: number,
): Promise<{ data: T } | { response: NextResponse }> {
  const parsed = await readJsonWithLimit<T>(request, maxBytes);
  if (!parsed.ok) {
    return {
      response: NextResponse.json(
        { error: parsed.error },
        { status: parsed.status ?? 400 },
      ),
    };
  }
  return { data: parsed.data as T };
}
