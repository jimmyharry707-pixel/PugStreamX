import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { isDuplicateUid, newScheduleUid, withLinks } from "./queries";
import type { Schedule, ScheduleDoc, ScheduleInput } from "./types";

// Every write is filtered by `userId`, so members can only change their own schedules.

export async function createSchedule(userId: ObjectId, input: ScheduleInput): Promise<Schedule> {
  const now = new Date();
  const schedules = await getCollection<ScheduleDoc>("schedules");
  for (let attempt = 0; ; attempt++) {
    const doc: ScheduleDoc = { _id: new ObjectId(), userId, uid: newScheduleUid(), ...input, createdAt: now, updatedAt: now };
    try {
      await schedules.insertOne(doc);
      return (await withLinks(userId, [doc]))[0];
    } catch (err) {
      // The 10-digit ID was already taken (rare): draw another.
      if (!isDuplicateUid(err) || attempt >= 4) throw err;
    }
  }
}

/** Null if the schedule doesn't exist or isn't the member's. */
export async function updateSchedule(userId: ObjectId, scheduleId: ObjectId, input: ScheduleInput): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, userId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(userId, [doc]))[0] : null;
}

/** Changes only the times (dragging in the calendar). Null if it doesn't exist or isn't the member's. */
export async function rescheduleSchedule(userId: ObjectId, scheduleId: ObjectId, start: Date, end: Date): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, userId },
    { $set: { start, end, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(userId, [doc]))[0] : null;
}

/** False if the schedule doesn't exist or isn't the member's. Links to it are cleared. */
export async function deleteSchedule(userId: ObjectId, scheduleId: ObjectId): Promise<boolean> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndDelete({ _id: scheduleId, userId });
  if (!doc) return false;
  if (doc.uid) await schedules.updateMany({ userId, linkedUid: doc.uid }, { $set: { linkedUid: null } });
  return true;
}
