import "server-only";
import { ObjectId } from "mongodb";
import { avatarUrl } from "@/features/profile/constants";
import { getCollection } from "@/lib/db/client";
import { isSuperAdmin } from "./roles";
import type { PublicUser, UserDetails, UserDoc, UserListItem } from "./types";

// User reads are per-request and never cached: they back authentication.

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const users = await getCollection<UserDoc>("users");
  return users.findOne({ email });
}

export async function findUserById(id: ObjectId): Promise<UserDoc | null> {
  const users = await getCollection<UserDoc>("users");
  return users.findOne({ _id: id });
}

/** Every account, newest first, for the Admin page. Callers must check requireSuperAdmin(). */
export async function listUsers(): Promise<UserListItem[]> {
  const users = await getCollection<UserDoc>("users");
  const docs = await users.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
  return docs.map(toListItem);
}

/** One account with its full profile, for the Admin pages. Callers must check requireSuperAdmin(). */
export async function getUserDetails(id: ObjectId): Promise<UserDetails | null> {
  const user = await findUserById(id);
  if (!user) return null;
  const p = user.profile;
  return {
    ...toListItem(user),
    details: p?.completedAt
      ? { birthday: p.birthday, address: p.address, phone: p.phone, completedAt: p.completedAt.toISOString() }
      : null,
  };
}

function toListItem(user: UserDoc): UserListItem {
  return { ...toPublicUser(user), active: isActive(user), createdAt: user.createdAt.toISOString() };
}

/** Accounts created before activation existed have no `active` field; they count as inactive. */
export function isActive(user: UserDoc): boolean {
  return user.active === true;
}

export function toPublicUser(user: UserDoc): PublicUser {
  const complete = !!user.profile?.completedAt;
  const role = user.role ?? null;
  return {
    id: user._id.toHexString(),
    email: user.email,
    profileComplete: complete,
    profile:
      complete && user.profile
        ? {
            fullName: user.profile.fullName,
            displayName: user.profile.displayName,
            avatarUrl: avatarUrl(user.profile.avatarId.toHexString()),
          }
        : null,
    role,
    isSuperAdmin: isSuperAdmin(role),
    groupId: user.groupId?.toHexString() ?? null,
  };
}
