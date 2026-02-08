/**
 * Auth.js (NextAuth v5) configuration.
 * Google OAuth provider with JWT session strategy.
 * Allowlist enforcement: only emails in AllowedEmail table may sign in.
 * When AUTH_SECRET is not set (e.g. local dev), auth is disabled and routes are not protected.
 *
 * IMPORTANT: This module is imported by Edge middleware. All Node.js-only
 * dependencies (Prisma, crypto) are dynamically imported inside callbacks
 * so they are never bundled into the Edge function.
 */

import NextAuth, { type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const isAuthConfigured = Boolean(env.AUTH_SECRET);

/**
 * Lazily load the Prisma client. Called only inside callbacks that run
 * in the Node.js API route handler, never in Edge middleware.
 */
async function getPrisma() {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma;
}

const nextAuthConfig = {
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
  callbacks: {
    /**
     * signIn — enforce email allowlist.
     * Returns true to allow sign-in, or a redirect URL string to deny.
     */
    async signIn({ user }: { user: User }) {
      const prisma = await getPrisma();
      const email = user.email?.toLowerCase();
      if (!email) {
        await prisma.authAuditEvent.create({
          data: { email: "unknown", action: "sign_in", outcome: "denied_not_allowlisted" },
        });
        return "/auth/signin?error=AccessDenied";
      }

      const allowed = await prisma.allowedEmail.findUnique({
        where: { email },
      });

      if (!allowed) {
        await prisma.authAuditEvent.create({
          data: { email, action: "sign_in", outcome: "denied_not_allowlisted" },
        });
        return "/auth/signin?error=AccessDenied";
      }

      if (!allowed.isActive) {
        await prisma.authAuditEvent.create({
          data: { email, action: "sign_in", outcome: "denied_inactive" },
        });
        return "/auth/signin?error=AccessDenied";
      }

      await prisma.authAuditEvent.create({
        data: { email, action: "sign_in", outcome: "allowed" },
      });
      return true;
    },

    /** jwt — attach role from AllowedEmail to the token. */
    async jwt({ token, trigger }: { token: JWT; trigger?: string }) {
      // Refresh role on sign-in or session update
      if (trigger === "signIn" || trigger === "signUp" || !token.role) {
        const email = token.email?.toLowerCase();
        if (email) {
          const prisma = await getPrisma();
          const entry = await prisma.allowedEmail.findUnique({
            where: { email },
            select: { role: true },
          });
          token.role = entry?.role ?? "member";
        }
      }
      return token;
    },

    /** session — expose role on the client-side session object. */
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
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
