import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCollection } from "@/lib/db/client";
import { findUserById, toPublicUser } from "@/features/users/queries";
import type { PublicUser } from "@/features/users/types";
import { SESSION_COOKIE, SIGN_IN_PATH } from "./constants";
import { hashToken, type SessionDoc } from "./session";

// Data access layer for authentication: the single place that decides who the current user is.
// Proxy only checks that a cookie exists. Pages, actions and route handlers must use these functions.

/** The signed-in user, or null. Deduplicated within one request. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessions = await getCollection<SessionDoc>("sessions");
  const session = await sessions.findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await findUserById(session.userId);
  return user ? toPublicUser(user) : null;
});

/** The signed-in user. Redirects to the sign-in page if there isn't one. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);
  return user;
}
