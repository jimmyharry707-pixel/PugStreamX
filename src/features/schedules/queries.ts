import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import type { Schedule, ScheduleDoc } from "./types";

export function toSchedule(doc: ScheduleDoc): Schedule {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    start: doc.start.toISOString(),
    end: doc.end.toISOString(),
    timeZone: doc.timeZone ?? null,
    clientCompany: doc.clientCompany,
    interviewer: doc.interviewer,
    resumeUrl: doc.resumeUrl,
    jobDescriptionUrl: doc.jobDescriptionUrl,
    screenShareUrl: doc.screenShareUrl,
    note: doc.note,
  };
}

/** A member's schedules that overlap [from, to), earliest first. */
export async function listSchedules(userId: ObjectId, from: Date, to: Date): Promise<Schedule[]> {
  const schedules = await getCollection<ScheduleDoc>("schedules");
  const docs = await schedules
    .find({ userId, start: { $lt: to }, end: { $gt: from } })
    .sort({ start: 1 })
    .toArray();
  return docs.map(toSchedule);
}
