import type { ObjectId } from "mongodb";

/** A schedule (e.g. an interview) in `ps_schedules`. Only its owner can see or change it. */
export type ScheduleDoc = {
  _id: ObjectId;
  userId: ObjectId;
  /**
   * The schedule's unique 10-digit ID ("4829103756") that members see, copy, and use to link
   * schedules. Older schedules (none, or an old long ID) get one when first read (`withUids`).
   */
  uid: string;
  title: string;
  /** Exact moments (UTC). The calendar shows them in the viewer's chosen time zone. */
  start: Date;
  end: Date;
  /** The time zone the times were entered in ("America/New_York"). Missing on older schedules. */
  timeZone?: string;
  clientCompany: string;
  interviewer: string;
  /** Required for new schedules; missing on older ones. */
  meetingUrl?: string;
  resumeUrl: string;
  jobDescriptionUrl: string;
  screenShareUrl: string | null;
  /** The `uid` of another of the owner's schedules, or null. */
  linkedUid?: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** The fields a member enters. */
export type ScheduleInput = Pick<
  ScheduleDoc,
  "title" | "start" | "end" | "clientCompany" | "interviewer" | "resumeUrl" | "jobDescriptionUrl" | "screenShareUrl" | "note"
> & { timeZone: string; meetingUrl: string; linkedUid: string | null };

/** Just enough of a linked schedule to show and open it. */
export type LinkedSchedule = { uid: string; title: string; start: string; end: string };

/** A schedule as sent to the browser: no owner id, dates as ISO strings. */
export type Schedule = Omit<ScheduleInput, "start" | "end" | "timeZone" | "meetingUrl"> & {
  /** Database id, for actions. Members see `uid`. */
  id: string;
  uid: string;
  start: string;
  end: string;
  /** Null for older schedules saved without one. */
  timeZone: string | null;
  meetingUrl: string | null;
  /** The schedule `linkedUid` points to; null if there's none or it was deleted. */
  linked: LinkedSchedule | null;
};
