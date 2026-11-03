/** Form fields of a schedule. `timeZone` is the calendar's zone the date and times are typed in. */
export const SCHEDULE_FIELDS = [
  "title",
  "date",
  "from",
  "to",
  "timeZone",
  "clientCompany",
  "interviewer",
  "meetingUrl",
  "resumeUrl",
  "jobDescriptionUrl",
  "screenShareRequired",
  "techSupportRequired",
  "linkedUids",
  "note",
] as const;
export type ScheduleField = (typeof SCHEDULE_FIELDS)[number];

/** Form fields a Caller fills in. */
export type CallerField = "screenShareUrl" | "callerNote";

export const TITLE_MAX = 120;
export const NAME_MAX = 120;
export const URL_MAX = 2000;
export const NOTE_MAX = 2000;

/** Longest range of schedules the calendar may load at once (a week, with room to spare). */
export const SCHEDULE_RANGE_MAX_DAYS = 45;

export const SCHEDULES_API_PATH = "/api/schedules";

/** Most schedules one schedule can link to. */
export const LINKS_MAX = 20;

/** A schedule ID: 10 digits, e.g. "4829103756". */
export const SCHEDULE_UID_PATTERN = /^[1-9]\d{9}$/;
