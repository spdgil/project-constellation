#!/usr/bin/env node
/**
 * Seed the first admin user into the AllowedEmail table.
 * Usage: node scripts/seed-admin.mjs admin@example.com
 *
 * This solves the chicken-and-egg problem: an admin must exist in the
 * allowlist before anyone can sign in and manage it via the API.
 */

import pg from "pg";

const email = process.argv[2]?.toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/seed-admin.mjs <email>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  // Upsert: if the email already exists, promote to admin + re-activate
  const result = await pool.query(
    `INSERT INTO allowed_emails (id, email, role, is_active, created_at, updated_at)
     VALUES (gen_random_uuid()::text, $1, 'admin', true, NOW(), NOW())
     ON CONFLICT (email)
     DO UPDATE SET role = 'admin', is_active = true, updated_at = NOW()
     RETURNING id, email, role, is_active`,
    [email],
  );
  const row = result.rows[0];
  console.log(`Admin allowlisted: ${row.email} (id: ${row.id}, role: ${row.role})`);
} catch (err) {
  console.error("Failed to seed admin:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
