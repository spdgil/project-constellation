/**
 * GET    /api/deals/:id/documents/:docId  — Download document file
 * DELETE /api/deals/:id/documents/:docId  — Remove a document
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string; docId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { docId } = await context.params;
  try {
    const doc = await prisma.dealDocument.findUnique({
      where: { id: docId },
      select: { fileName: true, mimeType: true, fileData: true },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(doc.fileData);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.fileName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error(`GET document ${docId} error:`, error);
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
    });
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    await prisma.dealDocument.delete({ where: { id: docId } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error(`DELETE document ${docId} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
