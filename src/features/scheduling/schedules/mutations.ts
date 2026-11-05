import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { isDuplicateUid, newScheduleUid, withLinks } from "./queries";
import type { CallerInput, Schedule, ScheduleDoc, ScheduleInput } from "./types";

// Every write is filtered by `groupId`, so schedules only change within their group's calendar,
// and a Profile Manager's edits, drags and deletes also by `userId`: only the PM who made a
// schedule can change it. Callers (actions.ts) check the role first.

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
      doneAt: null,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await schedules.insertOne(doc);
      return (await withLinks(groupId, [doc], { viewerId: userId }))[0];
    } catch (err) {
      // The 10-digit ID was already taken (rare): draw another.
      if (!isDuplicateUid(err) || attempt >= 4) throw err;
    }
  }
}

/** Moved to start in the future: the interview hasn't started yet, so it's no longer done. */
const notDoneIfAhead = (start: Date) => (start.getTime() > Date.now() ? { doneAt: null } : {});

/** A Profile Manager's edit of their own schedule. Null if it isn't in the group, isn't theirs or has passed (ended). */
export async function updateSchedule(groupId: ObjectId, ownerId: ObjectId, scheduleId: ObjectId, input: ScheduleInput): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, groupId, userId: ownerId, end: { $gt: new Date() } },
    {
      // Screen share no longer required: the Caller's link goes too.
      $set: { ...input, ...(input.screenShareRequired ? {} : { screenShareUrl: null }), ...notDoneIfAhead(input.start), updatedAt: new Date() },
      // The earlier single link is replaced by the list.
      $unset: { linkedUid: "" },
    },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(groupId, [doc], { viewerId: ownerId }))[0] : null;
}

/**
 * Changes some of a Caller's fields, and when it was marked done (`doneAt`; null while not done).
 * Fields left out stay as they are. The screen share link is only saved while the schedule
 * requires one (as of `current`, the schedule the caller just read). Null if the schedule isn't
 * in the group.
 */
export async function updateCallerFields(
  groupId: ObjectId,
  current: ScheduleDoc,
  changes: Partial<CallerInput> & { doneAt?: Date | null },
): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const { screenShareUrl, ...rest } = changes;
  const required = current.screenShareRequired ?? !!current.screenShareUrl;
  const doc = await schedules.findOneAndUpdate(
    { _id: current._id, groupId },
    { $set: { ...rest, ...(required && screenShareUrl !== undefined ? { screenShareUrl } : {}), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(groupId, [doc]))[0] : null;
}

/** Changes only the times (dragging in the calendar). Null if it isn't in the group, isn't the owner's or has passed. */
export async function rescheduleSchedule(groupId: ObjectId, ownerId: ObjectId, scheduleId: ObjectId, start: Date, end: Date): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, groupId, userId: ownerId, end: { $gt: new Date() } },
    { $set: { start, end, ...notDoneIfAhead(start), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? (await withLinks(groupId, [doc], { viewerId: ownerId }))[0] : null;
}

/** False if it isn't in the group, isn't the owner's or has passed (ended). It's removed from other schedules' links. */
export async function deleteSchedule(groupId: ObjectId, ownerId: ObjectId, scheduleId: ObjectId): Promise<boolean> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndDelete({ _id: scheduleId, groupId, userId: ownerId, end: { $gt: new Date() } });
  if (!doc) return false;
  if (doc.uid) {
    await schedules.updateMany({ groupId, linkedUids: doc.uid }, { $pull: { linkedUids: doc.uid } });
    await schedules.updateMany({ groupId, linkedUid: doc.uid }, { $set: { linkedUid: null } });
  }
  return true;
}

/** Deletes every schedule in a group (when the group itself is deleted). Past ones included. */
export async function deleteSchedulesOf(groupId: ObjectId): Promise<number> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const { deletedCount } = await schedules.deleteMany({ groupId });
  return deletedCount;
}
