import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { getCollections } from "./mongodb";
import type { Category, NewStream, Stream } from "./types";

// All database access goes through this file. Reads are cached with "use cache" and
// tagged so writes can invalidate them via revalidateTag/updateTag.

const noId = { projection: { _id: 0 } } as const;

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const { categories } = await getCollections();
  return categories.find<Category>({}, noId).sort({ name: 1 }).toArray();
}

export async function getCategory(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const { categories } = await getCollections();
  return categories.findOne<Category>({ slug }, noId);
}

export async function getStreams(filter: { category?: string; q?: string; limit?: number } = {}): Promise<Stream[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("streams");

  const query: Record<string, unknown> = {};
  if (filter.category) query.category = filter.category;
  if (filter.q) {
    const pattern = { $regex: escapeRegex(filter.q), $options: "i" };
    query.$or = [{ title: pattern }, { streamer: pattern }, { tags: pattern }];
  }

  const { streams } = await getCollections();
  return streams
    .find<Stream>(query, noId)
    .sort({ viewers: -1 })
    .limit(filter.limit ?? 0)
    .toArray();
}

export async function getStream(id: string): Promise<Stream | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("streams");

  const { streams } = await getCollections();
  return streams.findOne<Stream>({ id }, noId);
}

export async function getStreamIds(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("streams");

  const { streams } = await getCollections();
  return streams.distinct("id");
}

/** Total viewers per category slug. */
export async function getCategoryViewerTotals(): Promise<Record<string, number>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("streams");

  const { streams } = await getCollections();
  const rows = await streams
    .aggregate<{ _id: string; viewers: number }>([{ $group: { _id: "$category", viewers: { $sum: "$viewers" } } }])
    .toArray();
  return Object.fromEntries(rows.map((r) => [r._id, r.viewers]));
}

/** Inserts a new live stream. Callers must invalidate the "streams" tag afterwards. */
export async function createStream(input: NewStream, category: Category): Promise<Stream> {
  const stream: Stream = {
    ...input,
    id: `${slugify(input.title)}-${randomUUID().slice(0, 6)}`,
    viewers: 0,
    live: true,
    gradient: category.gradient,
  };

  const { streams } = await getCollections();
  // insertOne adds `_id` to the object it's given, so pass a copy to keep `stream` plain.
  await streams.insertOne({ ...stream });
  return stream;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "stream"
  );
}
