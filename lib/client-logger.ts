/**
 * Client-side logger that forwards errors/warnings to the server log endpoint.
 * Falls back to console output in development.
 */

type ClientLogLevel = "info" | "warn" | "error";

interface ClientLogPayload {
  level: ClientLogLevel;
  message: string;
  context?: Record<string, unknown>;
  source?: string;
}

async function sendLog(payload: ClientLogPayload): Promise<void> {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Swallow errors — logging should never crash the UI.
  }
}

function logToConsole(level: ClientLogLevel, message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
  console[method](`[${level.toUpperCase()}] ${message}`, context ?? "");
}

export function logClientError(message: string, context?: Record<string, unknown>, source?: string) {
  logToConsole("error", message, context);
  void sendLog({ level: "error", message, context, source });
}

export function logClientWarn(message: string, context?: Record<string, unknown>, source?: string) {
  logToConsole("warn", message, context);
  void sendLog({ level: "warn", message, context, source });
}

export function logClientInfo(message: string, context?: Record<string, unknown>, source?: string) {
  logToConsole("info", message, context);
  void sendLog({ level: "info", message, context, source });
}
