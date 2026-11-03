import "server-only";
import { z } from "zod";
import { isValidTimeZone, zonedToUtc } from "@/lib/utils/time-zone";
import { NAME_MAX, NOTE_MAX, SCHEDULE_UID_PATTERN, TITLE_MAX, URL_MAX } from "./constants";

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

/** Empty optional fields are stored as null. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), schema.nullable());

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
    screenShareUrl: optional(link("Enter the screen share link.")),
    // Another schedule's ID. Whether it exists and is the member's is checked in the action.
    // Spaces and dashes are ignored ("482 910 3756").
    linkedUid: optional(
      z
        .string()
        .transform((v) => v.replace(/[\s-]/g, ""))
        .pipe(z.string().regex(SCHEDULE_UID_PATTERN, "Enter a 10-digit schedule ID.")),
    ),
    // Browsers send line breaks from a textarea as \r\n; store plain \n.
    note: optional(
      z
        .string()
        .trim()
        .transform((v) => v.replace(/\r\n?/g, "\n"))
        .pipe(z.string().max(NOTE_MAX, `Use at most ${NOTE_MAX} characters.`)),
    ),
  })
  .refine((v) => v.to > v.from, { path: ["to"], message: "End time must be after the start time." })
  .transform(({ date, from, to, ...rest }) => ({
    ...rest,
    start: zonedToUtc(date, from, rest.timeZone),
    end: zonedToUtc(date, to, rest.timeZone),
  }));
