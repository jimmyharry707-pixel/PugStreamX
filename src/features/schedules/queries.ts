import "server-only";
import { randomInt } from "node:crypto";
import { MongoServerError, ObjectId } from "mongodb";
import type { UserDoc } from "@/features/users/types";
import { getCollection } from "@/lib/db/client";
import { SCHEDULE_UID_PATTERN } from "./constants";
import type { LinkedSchedule, Schedule, ScheduleDoc } from "./types";

// Every read is for one group's calendar (`groupId`); callers decide access (access.ts).

/** A schedule's linked IDs, reading the earlier single `linkedUid` too. */
export function linkedUidsOf(doc: ScheduleDoc): string[] {
  return doc.linkedUids ?? (doc.linkedUid ? [doc.linkedUid] : []);
}

export function toSchedule(doc: ScheduleDoc, linked: LinkedSchedule[] = []): Schedule {
  return {
    id: doc._id.toHexString(),
    uid: doc.uid,
    title: doc.title,
    start: doc.start.toISOString(),
    end: doc.end.toISOString(),
    timeZone: doc.timeZone ?? null,
    clientCompany: doc.clientCompany,
    interviewer: doc.interviewer,
    meetingUrl: doc.meetingUrl ?? null,
    resumeUrl: doc.resumeUrl,
    jobDescriptionUrl: doc.jobDescriptionUrl,
    // Older schedules had a link typed by their creator: count that as required.
    screenShareRequired: doc.screenShareRequired ?? !!doc.screenShareUrl,
    screenShareUrl: doc.screenShareUrl ?? null,
    linkedUids: linkedUidsOf(doc),
    linked,
    note: doc.note,
    callerNote: doc.callerNote ?? null,
    doneAt: doc.doneAt?.toISOString() ?? null,
  };
}

/** A random 10-digit schedule ID. The unique index catches the rare repeat; callers retry. */
export function newScheduleUid(): string {
  return String(randomInt(1_000_000_000, 10_000_000_000));
}

/** True for the error MongoDB gives when a schedule ID is already taken. */
export function isDuplicateUid(err: unknown): boolean {
  return err instanceof MongoServerError && err.code === 11000 && !!err.keyPattern?.uid;
}

/**
 * Gives older schedules a 10-digit `uid`, once: those saved before IDs existed, and those with
 * the earlier long (UUID) IDs. Links to an old ID are moved to the new one.
 */
async function withUids(docs: ScheduleDoc[]): Promise<ScheduleDoc[]> {
  const outdated = docs.filter((doc) => !doc.uid || !SCHEDULE_UID_PATTERN.test(doc.uid));
  if (outdated.length === 0) return docs;
  const schedules = await getCollection<ScheduleDoc>("schedules");
  for (const doc of outdated) {
    const oldUid = doc.uid ?? null;
    for (let attempt = 0; ; attempt++) {
      const uid = newScheduleUid();
      try {
        // Only if it still has the old ID, so two requests can't give it different ones.
        const result = await schedules.updateOne(oldUid ? { _id: doc._id, uid: oldUid } : { _id: doc._id, uid: { $exists: false } }, { $set: { uid } });
        if (result.modifiedCount === 1) {
          if (oldUid) {
            await schedules.updateMany({ linkedUids: oldUid }, { $set: { "linkedUids.$": uid } });
            await schedules.updateMany({ linkedUid: oldUid }, { $set: { linkedUid: uid } });
          }
          doc.uid = uid;
        } else {
          doc.uid = (await schedules.findOne({ _id: doc._id }))?.uid ?? uid;
        }
        break;
      } catch (err) {
        if (!isDuplicateUid(err) || attempt >= 4) throw err;
      }
    }
    // Links in this batch to the old ID now point at the new one.
    if (oldUid) {
      for (const other of docs) {
        if (other.linkedUid === oldUid) other.linkedUid = doc.uid;
        other.linkedUids = other.linkedUids?.map((linked) => (linked === oldUid ? doc.uid : linked));
      }
    }
  }
  return docs;
}

/** Groups whose older schedules have been brought up to date (since this server started). */
const groupsChecked = new Set<string>();

/**
 * Once per group per server: schedules made before groups existed join their creator's group,
 * and any with old IDs get 10-digit ones (links to them may be in this group's calendar).
 */
async function upgradeOlderSchedules(groupId: ObjectId) {
  if (groupsChecked.has(groupId.toHexString())) return;
  const [users, schedules] = await Promise.all([getCollection<UserDoc>("users"), getCollection<ScheduleDoc>("schedules")]);
  const members = await users.find({ groupId }, { projection: { _id: 1 } }).toArray();
  if (members.length) {
    await schedules.updateMany({ groupId: { $exists: false }, userId: { $in: members.map((m) => m._id) } }, { $set: { groupId } });
  }
  await withUids(await schedules.find({ groupId, uid: { $not: SCHEDULE_UID_PATTERN } }).toArray());
  groupsChecked.add(groupId.toHexString());
}

/** Schedules with their linked schedules (from the same group) filled in. */
export async function withLinks(groupId: ObjectId, docs: ScheduleDoc[]): Promise<Schedule[]> {
  const uids = [...new Set(docs.flatMap(linkedUidsOf))];
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const linkedDocs = uids.length ? await schedules.find({ groupId, uid: { $in: uids } }).toArray() : [];
  const byUid = new Map(
    linkedDocs.map((d) => [d.uid, { uid: d.uid, title: d.title, start: d.start.toISOString(), end: d.end.toISOString() }]),
  );
  return docs.map((doc) =>
    toSchedule(
      doc,
      linkedUidsOf(doc).flatMap((uid) => byUid.get(uid) ?? []),
    ),
  );
}

/** A group's schedules that overlap [from, to), earliest first. */
export async function listSchedules(groupId: ObjectId, from: Date, to: Date): Promise<Schedule[]> {
  await upgradeOlderSchedules(groupId);
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const docs = await schedules
    .find({ groupId, start: { $lt: to }, end: { $gt: from } })
    .sort({ start: 1 })
    .toArray();
  return withLinks(groupId, await withUids(docs));
}

/** One of the group's schedules by its `uid`, or null (also for other groups' schedules). */
export async function findScheduleByUid(groupId: ObjectId, uid: string): Promise<Schedule | null> {
  await upgradeOlderSchedules(groupId);
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOne({ groupId, uid });
  return doc ? (await withLinks(groupId, [doc]))[0] : null;
}

/** Which of `uids` are schedules in the group. */
export async function findGroupUids(groupId: ObjectId, uids: string[]): Promise<Set<string>> {
  if (uids.length === 0) return new Set();
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const docs = await schedules.find({ groupId, uid: { $in: uids } }, { projection: { uid: 1 } }).toArray();
  return new Set(docs.map((doc) => doc.uid));
}

/** The group's schedule document by database id (for checks in actions), or null. */
export async function findScheduleDoc(groupId: ObjectId, scheduleId: ObjectId): Promise<ScheduleDoc | null> {
  await upgradeOlderSchedules(groupId);
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOne({ _id: scheduleId, groupId });
  return doc ? (await withUids([doc]))[0] : null;
}
