import "server-only";
import { MongoClient } from "mongodb";
import type { Category, Stream } from "./types";

// Reuse one client across hot reloads in dev and across requests in prod.
const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  }
  globalForMongo._mongoClientPromise ??= new MongoClient(uri).connect();
  return globalForMongo._mongoClientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB ?? "pugstreamx");
}

export async function getCollections() {
  const db = await getDb();
  return {
    streams: db.collection<Stream>("streams"),
    categories: db.collection<Category>("categories"),
  };
}
