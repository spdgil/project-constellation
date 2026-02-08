/**
 * PATCH  /api/access/allowlist/[id] — update role or active status (admin only).
 * DELETE /api/access/allowlist/[id] — deactivate an allowlisted email (admin only).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  requireAdminOrResponse,
  rateLimitOrResponse,
  readJsonWithLimitOrResponse,
} from "@/lib/api-guards";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateLimitOrResponse(request, "allowlist:update", 10, 60_000);
  if (rl) return rl;

  const authErr = await requireAdminOrResponse();
  if (authErr) return authErr;

  const { id } = await params;

  const parsed = await readJsonWithLimitOrResponse<z.infer<typeof updateSchema>>(
    request,
    4096,
  );
  if ("response" in parsed) return parsed.response;

  const validation = updateSchema.safeParse(parsed.data);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.allowedEmail.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = await rateLimitOrResponse(_request, "allowlist:delete", 10, 60_000);
  if (rl) return rl;

  const authErr = await requireAdminOrResponse();
  if (authErr) return authErr;

  const { id } = await params;

  const existing = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft-delete: deactivate rather than remove for audit trail
  const updated = await prisma.allowedEmail.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(updated);
}
