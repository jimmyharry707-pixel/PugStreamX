import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { isDuplicateUid, newScheduleUid, withLinks } from "./queries";
import type { CallerInput, Schedule, ScheduleDoc, ScheduleInput } from "./types";

// Every write is filtered by `groupId`, so schedules only change within their group's calendar.
// Callers (actions.ts) check the role first.

export async function createSchedule(groupId: ObjectId, userId: ObjectId, input: ScheduleInput): Promise<Schedule> {
  const now = new Date();
  const schedules = await getCollection<ScheduleDoc>("schedules");
  for (let attempt = 0; ; attempt++) {
    const doc: ScheduleDoc = {
      _id: new ObjectId(),
      userId,
      groupId,
      uid: newScheduleUid(),
      ...input,
      screenShareUrl: null,
      callerNote: null,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await schedules.insertOne(doc);
      return (await withLinks(groupId, [doc]))[0];
    } catch (err) {
      // The 10-digit ID was already taken (rare): draw another.
      if (!isDuplicateUid(err) || attempt >= 4) throw err;
    }
  }
}

/** A Profile Manager's edit. Null if the schedule isn't in the group. */
export async function updateSchedule(groupId: ObjectId, scheduleId: ObjectId, input: ScheduleInput): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, groupId },
    {
      // Screen share no longer required: the Caller's link goes too.
      $set: { ...input, ...(input.screenShareRequired ? {} : { screenShareUrl: null }), updatedAt: new Date() },
      // The earlier single link is replaced by the list.
      $unset: { linkedUid: "" },
    },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(groupId, [doc]))[0] : null;
}

/**
 * A Caller's fields. The screen share link is only saved while the schedule requires one.
 * Null if the schedule isn't in the group.
 */
export async function updateCallerFields(groupId: ObjectId, scheduleId: ObjectId, input: CallerInput): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const current = await schedules.findOne({ _id: scheduleId, groupId });
  if (!current) return null;
  const required = current.screenShareRequired ?? !!current.screenShareUrl;
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, groupId },
    { $set: { callerNote: input.callerNote, ...(required ? { screenShareUrl: input.screenShareUrl } : {}), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(groupId, [doc]))[0] : null;
}

/** Changes only the times (dragging in the calendar). Null if the schedule isn't in the group. */
export async function rescheduleSchedule(groupId: ObjectId, scheduleId: ObjectId, start: Date, end: Date): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, groupId },
    { $set: { start, end, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(groupId, [doc]))[0] : null;
}

/** False if the schedule isn't in the group. It's removed from other schedules' links. */
export async function deleteSchedule(groupId: ObjectId, scheduleId: ObjectId): Promise<boolean> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndDelete({ _id: scheduleId, groupId });
  if (!doc) return false;
  if (doc.uid) {
    await schedules.updateMany({ groupId, linkedUids: doc.uid }, { $pull: { linkedUids: doc.uid } });
    await schedules.updateMany({ groupId, linkedUid: doc.uid }, { $set: { linkedUid: null } });
  }
  return true;
}
