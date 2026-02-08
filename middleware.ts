/**
 * Edge middleware — protects all routes except public paths when auth is configured.
 * When AUTH_SECRET is not set (e.g. local dev), all routes are allowed through.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/lib/auth";

export async function middleware(
  request: NextRequest,
  event: { next: (response: NextResponse) => void }
) {
  if (!isAuthConfigured) {
    return NextResponse.next();
  }
  return (auth as (req: NextRequest, evt: typeof event) => Promise<NextResponse | null>)(
    request,
    event,
  ) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|about|_next|favicon\\.ico|images).*)",
  ],
};
