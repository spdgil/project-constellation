/**
 * Auth.js (NextAuth v5) — full Node.js configuration.
 *
 * Extends the Edge-safe base config (auth.config.ts) with callbacks that
 * use Prisma for allowlist enforcement, audit logging, and role propagation.
 *
 * DO NOT import this file from middleware.ts — use auth.config.ts instead.
 * This file is for API routes, server components, and server actions.
 */

import NextAuth, { type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authConfig, isAuthConfigured } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = isAuthConfigured
  ? NextAuth({
      ...authConfig,
      callbacks: {
        /**
         * signIn — enforce email allowlist.
         * Returns true to allow sign-in, or a redirect URL string to deny.
         */
        async signIn({ user }: { user: User }) {
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
          if (trigger === "signIn" || trigger === "signUp" || !token.role) {
            const email = token.email?.toLowerCase();
            if (email) {
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
    })
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
