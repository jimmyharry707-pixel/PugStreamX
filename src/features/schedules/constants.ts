/** Form fields of a schedule. `timeZone` is the calendar's zone the date and times are typed in. */
export const SCHEDULE_FIELDS = [
  "title",
  "date",
  "from",
  "to",
  "timeZone",
  "clientCompany",
  "interviewer",
  "resumeUrl",
  "jobDescriptionUrl",
  "screenShareUrl",
  "note",
] as const;
export type ScheduleField = (typeof SCHEDULE_FIELDS)[number];

export const TITLE_MAX = 120;
export const NAME_MAX = 120;
export const URL_MAX = 2000;
export const NOTE_MAX = 2000;

/** Longest range of schedules the calendar may load at once (a week, with room to spare). */
export const SCHEDULE_RANGE_MAX_DAYS = 45;

export const SCHEDULES_API_PATH = "/api/schedules";
