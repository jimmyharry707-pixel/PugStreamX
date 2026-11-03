import "server-only";
import { GridFSBucket, MongoClient, type Db, type Document } from "mongodb";
import { BUCKETS, COLLECTIONS, DB_NAME, INDEXES, type BucketKey, type CollectionKey } from "./config";

// Reuse one connection across hot reloads in dev and across requests in prod.
const globalForMongo = globalThis as typeof globalThis & {
  _psDbPromise?: Promise<Db>;
};

async function connect(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  }

  const client = await new MongoClient(uri).connect();
  const db = client.db(DB_NAME);

  for (const key of Object.keys(INDEXES) as CollectionKey[]) {
    if (INDEXES[key].length > 0) await db.collection(COLLECTIONS[key]).createIndexes(INDEXES[key]);
  }
  return db;
}

export function getDb(): Promise<Db> {
  globalForMongo._psDbPromise ??= connect().catch((err) => {
    // Don't cache a failed connection; let the next request retry.
    globalForMongo._psDbPromise = undefined;
    throw err;
  });
  return globalForMongo._psDbPromise;
}

/** Typed access to a registered collection, e.g. `getCollection<UserDoc>("users")`. */
export async function getCollection<T extends Document>(key: CollectionKey) {
  const db = await getDb();
  return db.collection<T>(COLLECTIONS[key]);
}

/** A registered GridFS bucket for storing files, e.g. `getBucket("avatars")`. */
export async function getBucket(key: BucketKey) {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: BUCKETS[key] });
}
