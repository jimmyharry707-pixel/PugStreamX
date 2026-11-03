import "server-only";
import { ObjectId } from "mongodb";
import type { ScheduleDoc } from "@/features/scheduling/schedules/types";
import type { UserDoc } from "@/features/account/users/types";
import { getCollection } from "@/lib/db/client";
import type { Group, GroupDoc, GroupListItem } from "./types";

const toGroup = (doc: GroupDoc): Group => ({ id: doc._id.toHexString(), name: doc.name });

/** Every group, by name. */
export async function listGroups(): Promise<Group[]> {
  const groups = await getCollection<GroupDoc>("groups");
  const docs = await groups.find({}).sort({ nameKey: 1 }).toArray();
  return docs.map(toGroup);
}

/** Every group with its member and schedule counts, for Admin > Groups. Callers must check requireSuperAdmin(). */
export async function listGroupsWithCounts(): Promise<GroupListItem[]> {
  const [groups, users, schedules] = await Promise.all([
    getCollection<GroupDoc>("groups"),
    getCollection<UserDoc>("users"),
    getCollection<ScheduleDoc>("schedules"),
  ]);
  const count = async (collection: typeof users | typeof schedules) => {
    const rows = await collection
      .aggregate<{ _id: ObjectId; n: number }>([{ $match: { groupId: { $type: "objectId" } } }, { $group: { _id: "$groupId", n: { $sum: 1 } } }])
      .toArray();
    return new Map(rows.map((r) => [r._id.toHexString(), r.n]));
  };
  const [docs, members, scheduleCounts] = await Promise.all([groups.find({}).sort({ nameKey: 1 }).toArray(), count(users), count(schedules)]);
  return docs.map((doc) => ({
    ...toGroup(doc),
    memberCount: members.get(doc._id.toHexString()) ?? 0,
    scheduleCount: scheduleCounts.get(doc._id.toHexString()) ?? 0,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function findGroup(id: ObjectId): Promise<Group | null> {
  const groups = await getCollection<GroupDoc>("groups");
  const doc = await groups.findOne({ _id: id });
  return doc ? toGroup(doc) : null;
}
