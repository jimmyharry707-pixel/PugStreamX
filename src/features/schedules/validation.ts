import "server-only";
import { z } from "zod";
import { isValidTimeZone, zonedToUtc } from "@/lib/utils/time-zone";
import { NAME_MAX, NOTE_MAX, TITLE_MAX, URL_MAX } from "./constants";

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

/**
 * The schedule form. Date and times are typed in the calendar's time zone (`timeZone`) and
 * become exact `start` / `end` moments.
 */
export const scheduleSchema = z
  .object({
    title: requiredText("Enter a title.", TITLE_MAX),
    date: z.iso.date({ error: "Choose a date." }),
    from: time("Choose a start time."),
    to: time("Choose an end time."),
    timeZone: z.string().refine(isValidTimeZone, "Unknown time zone. Reload the page and try again."),
    clientCompany: requiredText("Enter the client company.", NAME_MAX),
    interviewer: requiredText("Enter the interviewer.", NAME_MAX),
    resumeUrl: link("Enter the resume link."),
    jobDescriptionUrl: link("Enter the job description link."),
    screenShareUrl: optional(link("Enter the screen share link.")),
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
  .transform(({ date, from, to, timeZone, ...rest }) => ({
    ...rest,
    start: zonedToUtc(date, from, timeZone),
    end: zonedToUtc(date, to, timeZone),
  }));
