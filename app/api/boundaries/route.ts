import { loadQldLgaBoundaries } from "@/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
  const boundaries = await loadQldLgaBoundaries();
  return NextResponse.json(boundaries);
}
