/**
 * Environment variable validation.
 * Imported in server entry points to fail fast on missing configuration.
 */

import { z } from "zod";

/** Coerce empty string to undefined so optional vars work when set to "" in .env */
const optionalString = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: optionalString,
  NEXT_PUBLIC_MAPBOX_TOKEN: optionalString,
  AUTH_SECRET: optionalString,
  AUTH_GOOGLE_ID: optionalString,
  AUTH_GOOGLE_SECRET: optionalString,
  BLOB_READ_WRITE_TOKEN: optionalString,
  SENTRY_DSN: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and returns server environment variables.
 * Throws a descriptive error if required vars are missing.
 */
function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Missing or invalid environment variables:\n${formatted}`,
    );
  }
  return result.data;
}

/** Validated environment — import this instead of reading process.env directly. */
export const env = validateEnv();
