import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { COMPLETE_PROFILE_PATH } from "@/features/account/profile/constants";
import { getCollection } from "@/lib/db/client";
import { findUserById, isActive, toPublicUser } from "@/features/account/users/queries";
import type { PublicUser } from "@/features/account/users/types";
import { SESSION_COOKIE, SIGN_IN_PATH } from "./constants";
import { hashToken, type SessionDoc } from "./session";

// Data access layer for authentication: the single place that decides who the current user is.
// Proxy only checks that a cookie exists. Pages, actions and route handlers must use these functions.

/** The signed-in user, or null. Deduplicated within one request. */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // Session validity depends on the current time, so this must run per request, never in a
  // prerender. cookies() alone isn't enough: Partial Prefetching prerenders cookie-based content.
  await connection();
  const sessions = await getCollection<SessionDoc>("sessions");
  const session = await sessions.findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await findUserById(session.userId);
  // Inactive accounts have no access, even if a session is left over.
  return user && isActive(user) ? toPublicUser(user) : null;
});

/** The signed-in user. Redirects to the sign-in page if there isn't one. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);
  return user;
}

/**
 * The signed-in user with a completed profile. Redirects to sign-in, or to /complete-profile
 * if the profile isn't done. Every main-site page, action and route handler must call this.
 */
export async function requireCompleteProfile(): Promise<PublicUser> {
  const user = await requireUser();
  if (!user.profileComplete) redirect(COMPLETE_PROFILE_PATH);
  return user;
}

/**
 * A signed-in super-admin (role 0) with a completed profile. Everyone else gets a 404, so admin
 * pages don't reveal that they exist. Every admin page, action and route handler must call this.
 */
export async function requireSuperAdmin(): Promise<PublicUser> {
  const user = await requireCompleteProfile();
  if (!user.isSuperAdmin) notFound();
  return user;
}
