/**
 * Auth.js (NextAuth v5) configuration.
 * Google OAuth provider with JWT session strategy.
 * When AUTH_SECRET is not set (e.g. local dev), auth is disabled and routes are not protected.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const isAuthConfigured = Boolean(env.AUTH_SECRET);

const nextAuthConfig = {
  providers: [
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [Google]
      : []),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/auth/signin",
  },
};

export const { handlers, auth, signIn, signOut } = isAuthConfigured
  ? NextAuth(nextAuthConfig)
  : (() => {
      const notConfiguredError = {
        error:
          "Auth is not configured. Set AUTH_SECRET (run: npx auth secret), AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET in .env.local.",
      };
      return {
        handlers: {
          GET: (req: Request) => {
            const path = new URL(req.url).pathname;
            if (path.endsWith("/session")) {
              return NextResponse.json({ session: null });
            }
            return NextResponse.json(notConfiguredError, { status: 503 });
          },
          POST: () =>
            NextResponse.json(notConfiguredError, { status: 503 }),
        },
        auth: async () => null,
        signIn: async () => ({ url: "/", error: undefined, status: 200, ok: false }),
        signOut: async () => ({ url: "/", error: undefined, status: 200, ok: false }),
      };
    })();

export { isAuthConfigured };
