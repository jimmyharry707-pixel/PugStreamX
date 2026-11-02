import { NextResponse } from "next/server";
import { getStream } from "@/lib/data";

// GET /api/streams/:id
export async function GET(_request: Request, { params }: RouteContext<"/api/streams/[id]">) {
  const { id } = await params;
  const stream = await getStream(id);
  if (!stream) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(stream);
}
