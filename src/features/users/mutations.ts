import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { ROLES, type Role } from "./roles";
import type { UserDoc, UserProfile } from "./types";

export type CreateUserInput = Pick<UserDoc, "email" | "passwordHash">;

export type CreateUserResult = { ok: true; user: UserDoc } | { ok: false; reason: "email_taken" };

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const now = new Date();
  // New accounts have no role and stay inactive until a super-admin activates them.
  const user: UserDoc = { _id: new ObjectId(), ...input, role: null, active: false, createdAt: now, updatedAt: now };

  const users = await getCollection<UserDoc>("users");
  try {
    await users.insertOne(user);
  } catch (err) {
    // The unique index on `email` rejects duplicates, even when two sign-ups race.
    if (err instanceof MongoServerError && err.code === 11000) return { ok: false, reason: "email_taken" };
    throw err;
  }
  return { ok: true, user };
}

export type ProfileUpdate = Omit<UserProfile, "completedAt" | "avatarId"> & { avatarId?: ObjectId };

export type UpdateProfileResult = { ok: true } | { ok: false; reason: "display_name_taken" | "not_found" };

/** Updates an existing (completed) profile. `avatarId` is only changed when given. */
export async function updateUserProfile(userId: ObjectId, update: ProfileUpdate): Promise<UpdateProfileResult> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(update)) {
    if (value !== undefined) set[`profile.${key}`] = value;
  }

  const users = await getCollection<UserDoc>("users");
  try {
    const result = await users.updateOne({ _id: userId, "profile.completedAt": { $exists: true } }, { $set: set });
    return result.matchedCount === 1 ? { ok: true } : { ok: false, reason: "not_found" };
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) return { ok: false, reason: "display_name_taken" };
    throw err;
  }
}

export type SetProfileResult = { ok: true } | { ok: false; reason: "display_name_taken" | "already_complete" };

/** Saves the user's profile. Only works once: a completed profile isn't overwritten. */
export async function setUserProfile(userId: ObjectId, profile: UserProfile): Promise<SetProfileResult> {
  const users = await getCollection<UserDoc>("users");
  try {
    const result = await users.updateOne(
      { _id: userId, profile: { $exists: false } },
      { $set: { profile, updatedAt: new Date() } },
    );
    return result.matchedCount === 1 ? { ok: true } : { ok: false, reason: "already_complete" };
  } catch (err) {
    // The unique index on profile.displayNameKey rejects duplicates, even when two people race.
    if (err instanceof MongoServerError && err.code === 11000) return { ok: false, reason: "display_name_taken" };
    throw err;
  }
}

/**
 * Makes sure the site has a founder. If none exists, the oldest account becomes the founder
 * (role 0) and is activated, so the very first sign-up on a new database runs the site.
 */
export async function ensureFounder(): Promise<void> {
  const users = await getCollection<UserDoc>("users");
  if (await users.findOne({ role: ROLES.founder }, { projection: { _id: 1 } })) return;

  const oldest = await users.find({}, { projection: { _id: 1 } }).sort({ createdAt: 1, _id: 1 }).limit(1).next();
  if (oldest) {
    await users.updateOne({ _id: oldest._id }, { $set: { role: ROLES.founder, active: true, updatedAt: new Date() } });
  }
}

export type UpdateActiveResult = { ok: true; user: UserDoc } | { ok: false; reason: "not_found" | "founder" };

/** Activates or deactivates an account. Founders can't be deactivated. */
export async function updateUserActive(userId: ObjectId, active: boolean): Promise<UpdateActiveResult> {
  const users = await getCollection<UserDoc>("users");
  const user = await users.findOneAndUpdate(
    active ? { _id: userId } : { _id: userId, role: { $ne: ROLES.founder } },
    { $set: { active, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (user) return { ok: true, user };
  const exists = await users.findOne({ _id: userId }, { projection: { _id: 1 } });
  return { ok: false, reason: exists ? "founder" : "not_found" };
}

export type UpdateRoleResult = { ok: true; user: UserDoc } | { ok: false; reason: "not_found" };

/** Gives an account a role (a number from ROLES), or removes it with null. */
export async function updateUserRole(userId: ObjectId, role: Role | null): Promise<UpdateRoleResult> {
  const users = await getCollection<UserDoc>("users");
  const user = await users.findOneAndUpdate({ _id: userId }, { $set: { role, updatedAt: new Date() } }, { returnDocument: "after" });
  return user ? { ok: true, user } : { ok: false, reason: "not_found" };
}

export type DeleteUserResult = { ok: true; user: UserDoc } | { ok: false; reason: "not_found" | "founder" };

/**
 * Deletes an account document. Founders can't be deleted (change their role first).
 * Callers also remove what belongs to the user elsewhere: sessions and avatar file.
 */
export async function deleteUser(userId: ObjectId): Promise<DeleteUserResult> {
  const users = await getCollection<UserDoc>("users");
  const user = await users.findOneAndDelete({ _id: userId, role: { $ne: ROLES.founder } });
  if (user) return { ok: true, user };
  const exists = await users.findOne({ _id: userId }, { projection: { _id: 1 } });
  return { ok: false, reason: exists ? "founder" : "not_found" };
}
