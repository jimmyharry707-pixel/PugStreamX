import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { toSchedule } from "./queries";
import type { Schedule, ScheduleDoc, ScheduleInput } from "./types";

// Every write is filtered by `userId`, so members can only change their own schedules.

export async function createSchedule(userId: ObjectId, input: ScheduleInput): Promise<Schedule> {
  const now = new Date();
  const doc: ScheduleDoc = { _id: new ObjectId(), userId, ...input, createdAt: now, updatedAt: now };
  const schedules = await getCollection<ScheduleDoc>("schedules");
  await schedules.insertOne(doc);
  return toSchedule(doc);
}

/** Null if the schedule doesn't exist or isn't the member's. */
export async function updateSchedule(userId: ObjectId, scheduleId: ObjectId, input: ScheduleInput): Promise<Schedule | null> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const doc = await schedules.findOneAndUpdate(
    { _id: scheduleId, userId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? toSchedule(doc) : null;
}

/** False if the schedule doesn't exist or isn't the member's. */
export async function deleteSchedule(userId: ObjectId, scheduleId: ObjectId): Promise<boolean> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const result = await schedules.deleteOne({ _id: scheduleId, userId });
  return result.deletedCount === 1;
}
