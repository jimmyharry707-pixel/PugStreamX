import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { getCollection } from "@/lib/db/client";
import { SESSION_COOKIE, SESSION_TTL_MS } from "./constants";

/**
 * Document in the `ps_sessions` collection. The browser holds a random token, and the
 * database stores only its SHA-256 hash, so a leaked database can't be used to sign in.
 */
export type SessionDoc = {
  _id: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

/** Creates a session for the user and sets the session cookie. Call only from server actions or route handlers. */
export async function createSession(userId: ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const sessions = await getCollection<SessionDoc>("sessions");
  await sessions.insertOne({ _id: hashToken(token), userId, createdAt: now, expiresAt });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Deletes the current session from the database and clears the cookie. */
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const sessions = await getCollection<SessionDoc>("sessions");
    await sessions.deleteOne({ _id: hashToken(token) });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Signs the user out everywhere, e.g. when their account is deactivated. */
export async function deleteUserSessions(userId: ObjectId) {
  const sessions = await getCollection<SessionDoc>("sessions");
  await sessions.deleteMany({ userId });
}
