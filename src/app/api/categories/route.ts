import { NextResponse } from "next/server";
import { getCategories } from "@/lib/data";

// GET /api/categories
export async function GET() {
  return NextResponse.json(await getCategories());
}
