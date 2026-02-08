/**
 * Auth.js base configuration — Edge-compatible.
 *
 * This file must NOT import any Node.js-only modules (Prisma, crypto, fs, etc.)
 * because it is imported by the Edge middleware.
 *
 * The full auth configuration (with Node.js callbacks) lives in auth.ts and
 * is used by API routes and server components.
 */

import Google from "next-auth/providers/google";
import { env } from "@/lib/env";
import type { NextAuthConfig } from "next-auth";

export const isAuthConfigured = Boolean(env.AUTH_SECRET);

export const authConfig: NextAuthConfig = {
  providers: [
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [Google]
      : []),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
};
