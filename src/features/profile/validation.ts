import "server-only";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js/max";
import { z } from "zod";
import { ADDRESS_MAX, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN, FULL_NAME_MAX } from "./constants";

// Text fields of the profile form. The avatar file is checked separately in avatar.ts.
// Server-only: libphonenumber-js/max has full metadata and is too heavy for the browser.

const requiredText = (message: string) => z.string({ error: message }).trim().min(1, message);

/** Latest accepted birthday: today in the most-ahead time zone (UTC+14), so no one's "today" is rejected. */
function latestBirthday() {
  return new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function earliestBirthday() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 120);
  return d.toISOString().slice(0, 10);
}

export const profileSchema = z.object({
  fullName: requiredText("Enter your full name.").max(FULL_NAME_MAX, `Use at most ${FULL_NAME_MAX} characters.`),
  displayName: requiredText("Enter a display name.")
    .min(DISPLAY_NAME_MIN, `Use at least ${DISPLAY_NAME_MIN} characters.`)
    .max(DISPLAY_NAME_MAX, `Use at most ${DISPLAY_NAME_MAX} characters.`)
    .regex(/^[A-Za-z0-9._-]+$/, "Use only letters, numbers, dots (.), dashes (-) and underscores (_)."),
  birthday: z
    .iso.date({ error: "Enter your birthday." })
    .refine((d) => d <= latestBirthday(), "Birthday can't be in the future.")
    .refine((d) => d >= earliestBirthday(), "Enter a real birthday."),
  address: requiredText("Enter your address.").max(ADDRESS_MAX, `Use at most ${ADDRESS_MAX} characters.`),
  phone: requiredText("Enter your phone number.")
    .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number for the selected country.")
    .transform((v, ctx) => {
      const parsed = parsePhoneNumberFromString(v);
      if (!parsed?.country) {
        ctx.addIssue({ code: "custom", message: "Choose your country and enter a local phone number." });
        return z.NEVER;
      }
      return { number: parsed.number, country: parsed.country };
    }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
