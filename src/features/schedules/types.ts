import type { ObjectId } from "mongodb";

/**
 * A schedule (e.g. an interview) in `ps_schedules`. It belongs to a group: the group's Profile
 * Managers make and change it, its Callers see it and fill in the caller fields.
 */
export type ScheduleDoc = {
  _id: ObjectId;
  /** Who created it. */
  userId: ObjectId;
  /** The group whose calendar it's on. Older schedules get their creator's group when read. */
  groupId?: ObjectId;
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
  /** Set by the Profile Manager: whether the Caller must add a screen share link. */
  screenShareRequired?: boolean;
  /** Added by a Caller, only while screen share is required. */
  screenShareUrl: string | null;
  /** The `uid`s of other schedules in the group, in the order entered. Missing on older ones. */
  linkedUids?: string[];
  /** Earlier: a single linked schedule. Read as a one-item `linkedUids`; removed on the next save. */
  linkedUid?: string | null;
  /** The Profile Manager's note. */
  note: string | null;
  /** The Caller's note. */
  callerNote?: string | null;
  /**
   * When the Caller clicked Done (after adding the screen share link, if required, and their
   * note). Null or missing while not done.
   */
  doneAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** The fields a Profile Manager enters. */
export type ScheduleInput = Pick<
  ScheduleDoc,
  "title" | "start" | "end" | "clientCompany" | "interviewer" | "resumeUrl" | "jobDescriptionUrl" | "note"
> & { timeZone: string; meetingUrl: string; screenShareRequired: boolean; linkedUids: string[] };

/** The fields a Caller fills in. */
export type CallerInput = { screenShareUrl: string | null; callerNote: string | null };

/** Just enough of a linked schedule to show and open it. */
export type LinkedSchedule = { uid: string; title: string; start: string; end: string };

/** A schedule as sent to the browser: no user or group ids, dates as ISO strings. */
export type Schedule = Omit<ScheduleInput, "start" | "end" | "timeZone" | "meetingUrl"> & {
  /** Database id, for actions. Members see `uid`. */
  id: string;
  uid: string;
  start: string;
  end: string;
  /** Null for older schedules saved without one. */
  timeZone: string | null;
  meetingUrl: string | null;
  screenShareUrl: string | null;
  callerNote: string | null;
  /** When the Caller marked it done (ISO), or null. */
  doneAt: string | null;
  /** The schedules `linkedUids` point to, in order (any that no longer exist are left out). */
  linked: LinkedSchedule[];
};

/**
 * What the viewer may do in a calendar: "manage" (Profile Manager: everything), "call" (Caller:
 * see everything, fill in the caller fields) or "view" (super-admin: see any group's calendar).
 */
export type CalendarMode = "manage" | "call" | "view";
