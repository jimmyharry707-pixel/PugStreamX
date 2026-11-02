import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createStream, getCategory, getStreams } from "@/lib/data";

// GET /api/streams?category=gaming&q=speedrun
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const streams = await getStreams({
    category: params.get("category") ?? undefined,
    q: params.get("q")?.trim() || undefined,
  });
  return NextResponse.json(streams);
}

// POST /api/streams  { title, streamer, category, tags? }
// NOTE: no authentication yet. Add an auth check before deploying publicly.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const streamer = typeof body?.streamer === "string" ? body.streamer.trim() : "";
  const categorySlug = typeof body?.category === "string" ? body.category : "";
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((t: unknown): t is string => typeof t === "string").slice(0, 5)
    : [];

  if (!title || !streamer || !categorySlug) {
    return NextResponse.json({ error: "title, streamer and category are required" }, { status: 400 });
  }
  if (title.length > 140 || streamer.length > 40) {
    return NextResponse.json({ error: "title or streamer is too long" }, { status: 400 });
  }

  const category = await getCategory(categorySlug);
  if (!category) {
    return NextResponse.json({ error: `unknown category "${categorySlug}"` }, { status: 400 });
  }

  const stream = await createStream({ title, streamer, category: category.slug, tags }, category);
  revalidateTag("streams", "max");
  return NextResponse.json(stream, { status: 201 });
}
