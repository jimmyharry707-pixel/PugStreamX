// Database naming rules live here. Do not hard-code database, collection or bucket names anywhere else.
import type { IndexDescription } from "mongodb";

/** Fixed by project rule. Not configurable per environment. */
export const DB_NAME = "PugStreamX";

/** Every collection must be registered here, and its name must start with `ps_`. */
export const COLLECTIONS = {
  users: "ps_users",
  sessions: "ps_sessions",
  schedules: "ps_schedules",
} as const satisfies Record<string, `ps_${string}`>;

export type CollectionKey = keyof typeof COLLECTIONS;

/**
 * GridFS buckets for files. A bucket named `ps_x` stores its data in the collections
 * `ps_x.files` and `ps_x.chunks`, so they follow the `ps_` rule too.
 */
export const BUCKETS = {
  avatars: "ps_avatars",
} as const satisfies Record<string, `ps_${string}`>;

export type BucketKey = keyof typeof BUCKETS;

/** Indexes for each collection. Created automatically on first connection (idempotent). */
export const INDEXES: Record<CollectionKey, IndexDescription[]> = {
  users: [
    { key: { email: 1 }, unique: true },
    // Display names are unique ignoring case. Only users who completed their profile have one.
    {
      key: { "profile.displayNameKey": 1 },
      unique: true,
      partialFilterExpression: { "profile.displayNameKey": { $exists: true } },
    },
    // Finding the founder (role 0) on sign-in.
    { key: { role: 1 } },
    // The Admin page lists accounts newest first.
    { key: { createdAt: -1 } },
  ],
  sessions: [
    { key: { userId: 1 } },
    // MongoDB deletes sessions automatically once `expiresAt` has passed.
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  schedules: [
    // The calendar loads one member's schedules for a week.
    { key: { userId: 1, start: 1 } },
  ],
};
