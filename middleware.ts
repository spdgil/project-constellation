/**
 * Edge middleware — protects all routes except public paths when auth is configured.
 * When AUTH_SECRET is not set (e.g. local dev), all routes are allowed through.
 *
 * IMPORTANT: imports from auth.config (Edge-safe), NOT auth.ts (Node.js-only).
 */

import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig, isAuthConfigured } from "@/lib/auth.config";

const { auth: authMiddleware } = NextAuth(authConfig);

export async function middleware(
  request: NextRequest,
  event: { next: (response: NextResponse) => void },
) {
  if (!isAuthConfigured) {
    return NextResponse.next();
  }
  return (
    authMiddleware as (
      req: NextRequest,
      evt: typeof event,
    ) => Promise<NextResponse | null>
  )(request, event) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|about|_next|favicon\\.ico|images).*)",
  ],
};
