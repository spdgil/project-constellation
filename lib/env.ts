/**
 * Environment variable validation.
 * Imported in server entry points to fail fast on missing configuration.
 */

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required").optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1, "NEXT_PUBLIC_MAPBOX_TOKEN is required").optional(),
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
