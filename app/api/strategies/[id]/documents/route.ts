/**
 * GET  /api/strategies/:id/documents       — List documents for a strategy
 * POST /api/strategies/:id/documents       — Upload a document to a strategy
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validateUploadedFile } from "@/lib/validations";
import { uploadToBlob } from "@/lib/blob-storage";
import { logger } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const docs = await prisma.strategyDocument.findMany({
      where: { strategyId: id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        fileUrl: true,
        label: true,
        addedAt: true,
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json(
      docs.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        fileUrl: d.fileUrl,
        label: d.label,
        addedAt: d.addedAt.toISOString(),
      })),
    );
  } catch (error) {
    logger.error("GET /api/strategies/:id/documents failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to load documents" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    // Verify strategy exists
    const strategy = await prisma.sectorDevelopmentStrategy.findUnique({
      where: { id },
    });
    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const label = formData.get("label") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file size and MIME type
    const fileError = validateUploadedFile(file);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // Upload to Vercel Blob
    const fileUrl = await uploadToBlob(file, { folder: `strategies/${id}` });

    const doc = await prisma.strategyDocument.create({
      data: {
        strategyId: id,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        fileUrl,
        label: label || null,
      },
    });

    return NextResponse.json(
      {
        id: doc.id,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        fileUrl: doc.fileUrl,
        label: doc.label,
        addedAt: doc.addedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("POST /api/strategies/:id/documents failed", { id, error: String(error) });
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}
