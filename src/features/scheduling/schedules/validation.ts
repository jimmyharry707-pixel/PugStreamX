import "server-only";
import { z } from "zod";
import { isValidTimeZone, zonedToUtc } from "@/lib/utils/time-zone";
import { LINKS_MAX, NAME_MAX, NOTE_MAX, SCHEDULE_UID_PATTERN, TITLE_MAX, URL_MAX } from "./constants";

const requiredText = (message: string, max: number) =>
  z.string({ error: message }).trim().min(1, message).max(max, `Use at most ${max} characters.`);

/** A web link. Only http(s), so a link can never run script (`javascript:`) when clicked. */
const link = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(URL_MAX, `Use at most ${URL_MAX} characters.`)
    .refine((value) => {
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "Enter a full link starting with https://");

/** Empty or missing optional fields are stored as null (e.g. no link field while screen share isn't required). */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v), schema.nullable());

/** A note. Browsers send line breaks from a textarea as \r\n; store plain \n. */
const noteText = z
  .string()
  .trim()
  .transform((v) => v.replace(/\r\n?/g, "\n"))
  .pipe(z.string().max(NOTE_MAX, `Use at most ${NOTE_MAX} characters.`));

/**
 * A Caller's fields. The link only counts while the schedule requires screen share. `intent` is
 * the button clicked: Save, Done, or Undo done ("reopen").
 */
export const callerSchema = z.object({
  scheduleId: z.string().regex(/^[a-f0-9]{24}$/i),
  intent: z.enum(["save", "done", "reopen"]).catch("save"),
  screenShareUrl: optional(link("Enter the screen share link.")),
  callerNote: optional(noteText),
});

/** "482 910-3756" → "4829103756". */
export const normalizeUid = (value: string) => value.replace(/[\s-]/g, "");

const time = (message: string) => z.string({ error: message }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, message);

/** New times for a schedule dragged in the calendar: exact moments, at most a day long. */
export const rescheduleSchema = z
  .object({
    scheduleId: z.string().regex(/^[a-f0-9]{24}$/i),
    start: z.iso.datetime().transform((v) => new Date(v)),
    end: z.iso.datetime().transform((v) => new Date(v)),
  })
  .refine((v) => v.end > v.start && v.end.getTime() - v.start.getTime() <= 24 * 60 * 60 * 1000);

/**
 * The schedule form. Date and times are read in the chosen `timeZone` (kept with the schedule)
 * and become exact `start` / `end` moments.
 */
export const scheduleSchema = z
  .object({
    title: requiredText("Enter a title.", TITLE_MAX),
    date: z.iso.date({ error: "Choose a date." }),
    from: time("Choose a start time."),
    to: time("Choose an end time."),
    timeZone: z.string({ error: "Choose a time zone." }).refine(isValidTimeZone, "Choose a time zone from the list."),
    clientCompany: requiredText("Enter the client company.", NAME_MAX),
    interviewer: requiredText("Enter the interviewer.", NAME_MAX),
    meetingUrl: link("Enter the meeting link."),
    resumeUrl: link("Enter the resume link."),
    jobDescriptionUrl: link("Enter the job description link."),
    // A switch: sent as "on" when on, missing when off. The Caller adds the link itself.
    screenShareRequired: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
    // Other schedules' IDs, one per row. Whether they're in the group is checked in the action. Spaces and dashes are ignored ("482 910 3756"); empty rows and repeats dropped.
    linkedUids: z
      .array(
        z
          .string()
          .transform(normalizeUid)
          .refine((v) => v === "" || SCHEDULE_UID_PATTERN.test(v), "Enter a 10-digit schedule ID."),
      )
      .transform((uids) => [...new Set(uids.filter(Boolean))])
      .refine((uids) => uids.length <= LINKS_MAX, `Link at most ${LINKS_MAX} schedules.`),
    note: optional(noteText),
  })
  .refine((v) => v.to > v.from, { path: ["to"], message: "End time must be after the start time." })
  .transform(({ date, from, to, ...rest }) => ({
    ...rest,
    start: zonedToUtc(date, from, rest.timeZone),
    end: zonedToUtc(date, to, rest.timeZone),
  }));
