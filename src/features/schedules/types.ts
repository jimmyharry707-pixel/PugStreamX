import type { ObjectId } from "mongodb";

/** A schedule (e.g. an interview) in `ps_schedules`. Only its owner can see or change it. */
export type ScheduleDoc = {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  /** Exact moments (UTC). The calendar shows them in the viewer's chosen time zone. */
  start: Date;
  end: Date;
  clientCompany: string;
  interviewer: string;
  resumeUrl: string;
  jobDescriptionUrl: string;
  screenShareUrl: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** The fields a member enters. */
export type ScheduleInput = Pick<
  ScheduleDoc,
  "title" | "start" | "end" | "clientCompany" | "interviewer" | "resumeUrl" | "jobDescriptionUrl" | "screenShareUrl" | "note"
>;

/** A schedule as sent to the browser: no owner id, dates as ISO strings. */
export type Schedule = Omit<ScheduleInput, "start" | "end"> & {
  id: string;
  start: string;
  end: string;
};
