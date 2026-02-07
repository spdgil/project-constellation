"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side session provider wrapper.
 * Extracted so the root layout can remain a Server Component.
 */
export function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
