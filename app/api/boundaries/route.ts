import { loadQldLgaBoundaries } from "@/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const boundaries = await loadQldLgaBoundaries();
    return NextResponse.json(boundaries, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to load LGA boundaries:", error);
    return NextResponse.json(
      { error: "Failed to load boundary data" },
      { status: 500 },
    );
  }
}
