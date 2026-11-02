// Seeds MongoDB with sample categories and streams, and creates indexes.
// Run with: npm run db:seed   (safe to re-run: documents are upserted by their key)
import { MongoClient } from "mongodb";
import { categories, streams } from "./seed-data";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB ?? "pugstreamx");

    const categoryResult = await db.collection("categories").bulkWrite(
      categories.map((c) => ({ replaceOne: { filter: { slug: c.slug }, replacement: c, upsert: true } })),
    );
    const streamResult = await db.collection("streams").bulkWrite(
      streams.map((s) => ({ replaceOne: { filter: { id: s.id }, replacement: s, upsert: true } })),
    );

    await db.collection("categories").createIndex({ slug: 1 }, { unique: true });
    await db.collection("streams").createIndexes([
      { key: { id: 1 }, unique: true },
      { key: { category: 1, viewers: -1 } },
      { key: { viewers: -1 } },
    ]);

    console.log(
      `Seeded "${db.databaseName}": ` +
        `categories ${categoryResult.upsertedCount} new / ${categoryResult.modifiedCount} updated, ` +
        `streams ${streamResult.upsertedCount} new / ${streamResult.modifiedCount} updated.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
