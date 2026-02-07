/**
 * Sentry client-side configuration.
 * Loaded automatically by @sentry/nextjs via the instrumentation hook.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of errors, sample 10% of transactions for performance
  tracesSampleRate: 0.1,

  // Disable in development
  enabled: process.env.NODE_ENV === "production",

  // Reduce noise: filter browser extension errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection captured",
  ],
});
