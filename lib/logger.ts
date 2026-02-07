/**
 * Lightweight structured JSON logger.
 * Outputs JSON lines in production (compatible with Vercel log drain, CloudWatch, Datadog).
 * In development, falls back to readable console output.
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (process.env.NODE_ENV === "production") {
    // JSON lines for log aggregation
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](JSON.stringify(entry));
  } else {
    // Readable format for local dev
    const prefix = `[${level.toUpperCase()}]`;
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](prefix, payload.message, payload);
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    emit("info", { message, ...context });
  },
  warn(message: string, context?: Record<string, unknown>) {
    emit("warn", { message, ...context });
  },
  error(message: string, context?: Record<string, unknown>) {
    emit("error", { message, ...context });
  },
};
