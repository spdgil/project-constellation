/**
 * Next.js instrumentation hook.
 * Initialises Sentry for server-side and edge runtimes.
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
    console.error(
      "CRITICAL: AUTH_SECRET is not set in production. All routes are unprotected!",
    );
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
