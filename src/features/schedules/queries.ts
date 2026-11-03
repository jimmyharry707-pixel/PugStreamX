import "server-only";
import { randomInt } from "node:crypto";
import { MongoServerError, ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { SCHEDULE_UID_PATTERN } from "./constants";
import type { LinkedSchedule, Schedule, ScheduleDoc } from "./types";

export function toSchedule(doc: ScheduleDoc, linked: LinkedSchedule | null = null): Schedule {
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
    screenShareUrl: doc.screenShareUrl,
    linkedUid: doc.linkedUid ?? null,
    linked,
    note: doc.note,
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
    let result;
    for (let attempt = 0; ; attempt++) {
      const uid = newScheduleUid();
      try {
        // Only if it still has the old ID, so two requests can't give it different ones.
        result = await schedules.updateOne(oldUid ? { _id: doc._id, uid: oldUid } : { _id: doc._id, uid: { $exists: false } }, { $set: { uid } });
        if (result.modifiedCount === 1) {
          if (oldUid) await schedules.updateMany({ userId: doc.userId, linkedUid: oldUid }, { $set: { linkedUid: uid } });
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
    if (oldUid) for (const other of docs) if (other.linkedUid === oldUid) other.linkedUid = doc.uid;
  }
  return docs;
}

/** Schedules with their linked schedules filled in (the owner's only). */
export async function withLinks(userId: ObjectId, docs: ScheduleDoc[]): Promise<Schedule[]> {
  const uids = [...new Set(docs.map((doc) => doc.linkedUid).filter((uid): uid is string => !!uid))];
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const linkedDocs = uids.length ? await schedules.find({ userId, uid: { $in: uids } }).toArray() : [];
  const byUid = new Map(
    linkedDocs.map((d) => [d.uid, { uid: d.uid, title: d.title, start: d.start.toISOString(), end: d.end.toISOString() }]),
  );
  return docs.map((doc) => toSchedule(doc, (doc.linkedUid && byUid.get(doc.linkedUid)) || null));
}

/** Members whose schedules have all been given 10-digit IDs (since this server started). */
const idsChecked = new Set<string>();

/** A member's schedules that overlap [from, to), earliest first. */
export async function listSchedules(userId: ObjectId, from: Date, to: Date): Promise<Schedule[]> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const docs = await schedules
    .find({ userId, start: { $lt: to }, end: { $gt: from } })
    .sort({ start: 1 })
    .toArray();
  // Once per member per server: schedules in other weeks may still have old IDs, and links
  // here may point at them.
  if (!idsChecked.has(userId.toHexString())) {
    await withUids(await schedules.find({ userId, uid: { $not: SCHEDULE_UID_PATTERN } }).toArray());
    idsChecked.add(userId.toHexString());
    return listSchedules(userId, from, to);
  }
  return withLinks(userId, await withUids(docs));
}

/** One of the member's schedules by its `uid`, or null (also for other members' schedules). */
export async function findScheduleByUid(userId: ObjectId, uid: string): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOne({ userId, uid });
  return doc ? (await withLinks(userId, [doc]))[0] : null;
}

/** The member's schedule document by database id (for checks in actions), or null. */
export async function findScheduleDoc(userId: ObjectId, scheduleId: ObjectId): Promise<ScheduleDoc | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOne({ _id: scheduleId, userId });
  return doc ? (await withUids([doc]))[0] : null;
}
