// Database naming rules live here. Do not hard-code database or collection names anywhere else.
import type { IndexDescription } from "mongodb";

/** Fixed by project rule. Not configurable per environment. */
export const DB_NAME = "PugStreamX";

/** Every collection must be registered here, and its name must start with `ps_`. */
export const COLLECTIONS = {
  users: "ps_users",
  sessions: "ps_sessions",
} as const satisfies Record<string, `ps_${string}`>;

export type CollectionKey = keyof typeof COLLECTIONS;

/** Indexes for each collection. Created automatically on first connection (idempotent). */
export const INDEXES: Record<CollectionKey, IndexDescription[]> = {
  users: [{ key: { email: 1 }, unique: true }],
  sessions: [
    { key: { userId: 1 } },
    // MongoDB deletes sessions automatically once `expiresAt` has passed.
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
};
