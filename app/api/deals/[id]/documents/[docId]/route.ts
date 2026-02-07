/**
 * GET    /api/deals/:id/documents/:docId  — Redirect to blob URL for download
 * DELETE /api/deals/:id/documents/:docId  — Remove a document
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deleteFromBlob } from "@/lib/blob-storage";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string; docId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { docId } = await context.params;
  try {
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

export async function DELETE(_req: Request, context: RouteContext) {
  const { docId } = await context.params;
  try {
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
