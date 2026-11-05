import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import { deleteSchedulesOf } from "@/features/scheduling/schedules/mutations";
import type { UserDoc } from "@/features/account/users/types";
import { getCollection } from "@/lib/db/client";
import type { GroupDoc } from "./types";

const isDuplicateName = (err: unknown) => err instanceof MongoServerError && err.code === 11000;

export async function createGroup(name: string): Promise<{ ok: true; id: string } | { ok: false; reason: "name_taken" }> {
  const now = new Date();
  const groups = await getCollection<GroupDoc>("groups");
  try {
    const { insertedId } = await groups.insertOne({ _id: new ObjectId(), name, nameKey: name.toLowerCase(), createdAt: now, updatedAt: now });
    return { ok: true, id: insertedId.toHexString() };
  } catch (err) {
    if (isDuplicateName(err)) return { ok: false, reason: "name_taken" };
    throw err;
  }
}

export async function renameGroup(id: ObjectId, name: string): Promise<{ ok: true } | { ok: false; reason: "name_taken" | "not_found" }> {
  const groups = await getCollection<GroupDoc>("groups");
  try {
    const result = await groups.updateOne({ _id: id }, { $set: { name, nameKey: name.toLowerCase(), updatedAt: new Date() } });
    return result.matchedCount ? { ok: true } : { ok: false, reason: "not_found" };
  } catch (err) {
    if (isDuplicateName(err)) return { ok: false, reason: "name_taken" };
    throw err;
  }
}

/**
 * Deletes a group that has no members (so nobody is left without a group), along with its
 * schedules: past schedules can't be deleted one by one, so they go with their group.
 */
export async function deleteGroup(id: ObjectId): Promise<{ ok: true; schedules: number } | { ok: false; reason: "not_found" | "has_members" }> {
  const [groups, users] = await Promise.all([getCollection<GroupDoc>("groups"), getCollection<UserDoc>("users")]);
  if (await users.countDocuments({ groupId: id })) return { ok: false, reason: "has_members" };
  const result = await groups.deleteOne({ _id: id });
  if (!result.deletedCount) return { ok: false, reason: "not_found" };
  return { ok: true, schedules: await deleteSchedulesOf(id) };
}
