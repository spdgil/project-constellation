/**
 * GET  /api/access/allowlist — list all allowlisted emails (admin only).
 * POST /api/access/allowlist — add an email to the allowlist (admin only).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  requireAdminOrResponse,
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
} from "@/lib/api-guards";
import { z } from "zod";

export async function GET(request: Request) {
  const rl = await rateLimitOrResponse(request, "allowlist:list", 30, 60_000);
  if (rl) return rl;

  const authErr = await requireAdminOrResponse();
  if (authErr) return authErr;

  const entries = await prisma.allowedEmail.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}

const createSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
  role: z.enum(["admin", "member"]).default("member"),
});

export async function POST(request: Request) {
  const rl = await rateLimitOrResponse(request, "allowlist:create", 10, 60_000);
  if (rl) return rl;

  const authErr = await requireAdminOrResponse();
  if (authErr) return authErr;

  const parsed = await readJsonWithLimitOrResponse<z.infer<typeof createSchema>>(
    request,
    4096,
  );
  if ("response" in parsed) return parsed.response;

  const validation = createSchema.safeParse(parsed.data);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const { email, role } = validation.data;

  // Upsert to handle re-adding a previously removed email
  const entry = await prisma.allowedEmail.upsert({
    where: { email },
    update: { role, isActive: true },
    create: { email, role },
  });

  return NextResponse.json(entry, { status: 201 });
}
