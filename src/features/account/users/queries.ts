import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { avatarUrl } from "@/features/account/profile/constants";
import type { UserStatusFilter } from "@/features/organization/admin/constants";
import { getCollection } from "@/lib/db/client";
import { PAGE_SIZE, paginate, type Page } from "@/lib/utils/pagination";
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

/**
 * One page of accounts for Admin › Users, with the count for each filter. Inactive accounts
 * (waiting for activation) come first, then newest first. Callers must check requireSuperAdmin().
 */
export async function listUsersPage(
  status: UserStatusFilter,
  requestedPage: number,
  pageSize = PAGE_SIZE,
): Promise<{ items: UserListItem[]; page: Page; counts: Record<UserStatusFilter, number> }> {
  const users = await getCollection<UserDoc>("users");
  // Documents without `active` count as inactive (isActive()).
  const filter: Filter<UserDoc> = status === "active" ? { active: true } : status === "inactive" ? { active: { $ne: true } } : {};
  const [all, active] = await Promise.all([users.countDocuments({}), users.countDocuments({ active: true })]);
  const counts = { all, active, inactive: all - active };
  const page = paginate(requestedPage, counts[status], pageSize);
  // Ascending `active` puts missing and false (inactive) before true.
  const docs = await users
    .find(filter, { projection: { passwordHash: 0 } })
    .sort({ active: 1, createdAt: -1, _id: -1 })
    .skip(page.skip)
    .limit(page.pageSize)
    .toArray();
  return { items: docs.map(toListItem), page, counts };
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
