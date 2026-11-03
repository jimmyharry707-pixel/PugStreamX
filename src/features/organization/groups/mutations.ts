import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import type { ScheduleDoc } from "@/features/scheduling/schedules/types";
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

/** Only empty groups (no members, no schedules) can be deleted, so nothing is left without a group. */
export async function deleteGroup(id: ObjectId): Promise<{ ok: true } | { ok: false; reason: "not_found" | "not_empty" }> {
  const [groups, users, schedules] = await Promise.all([
    getCollection<GroupDoc>("groups"),
    getCollection<UserDoc>("users"),
    getCollection<ScheduleDoc>("schedules"),
  ]);
  const [members, scheduleCount] = await Promise.all([users.countDocuments({ groupId: id }), schedules.countDocuments({ groupId: id })]);
  if (members || scheduleCount) return { ok: false, reason: "not_empty" };
  const result = await groups.deleteOne({ _id: id });
  return result.deletedCount ? { ok: true } : { ok: false, reason: "not_found" };
}
