/**
 * GET    /api/deals/:id/documents/:docId  — Redirect to blob URL for download
 * DELETE /api/deals/:id/documents/:docId  — Remove a document
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deleteFromBlob } from "@/lib/blob-storage";
import { logger } from "@/lib/logger";
import { rateLimitOrResponse, requireAuthOrResponse } from "@/lib/api-guards";
import { IdParamSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string; docId: string }> };

export async function GET(req: Request, context: RouteContext) {
  const { id, docId } = await context.params;
  try {
    const dealIdError = validateIdParam(id, "deal id");
    if (dealIdError) return dealIdError;
    const docIdError = validateIdParam(docId, "document id");
    if (docIdError) return docIdError;

    const rateLimitResponse = await rateLimitOrResponse(
      req,
      "deal-document-download",
      120,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const doc = await prisma.dealDocument.findUnique({
      where: { id: docId },
      select: { fileUrl: true },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Redirect to the Vercel Blob URL
    return NextResponse.redirect(doc.fileUrl);
  } catch (error) {
    logger.error("GET document failed", { docId, error: String(error) });
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id, docId } = await context.params;
  try {
    const dealIdError = validateIdParam(id, "deal id");
    if (dealIdError) return dealIdError;
    const docIdError = validateIdParam(docId, "document id");
    if (docIdError) return docIdError;

    const authResponse = await requireAuthOrResponse();
    if (authResponse) return authResponse;

    const rateLimitResponse = await rateLimitOrResponse(
      req,
      "deal-document-delete",
      20,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const doc = await prisma.dealDocument.findUnique({
      where: { id: docId },
      select: { id: true, fileUrl: true },
    });
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob, then from database
    await deleteFromBlob(doc.fileUrl);
    await prisma.dealDocument.delete({ where: { id: docId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error("DELETE document failed", { docId, error: String(error) });
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

function validateIdParam(value: string, label: string) {
  const parsed = IdParamSchema.safeParse(value);
  if (!parsed.success) {
    return NextResponse.json({ error: `Invalid ${label}` }, { status: 400 });
  }
  return null;
}
