import "server-only";
import { z } from "zod";
import { MESSAGE_MAX, TITLE_MAX } from "./constants";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

/** Create (no `notificationId`) or edit (with one). `published` is a PsSwitch: "on" or missing. */
export const saveNotificationSchema = z.object({
  notificationId: z.union([z.literal(""), objectId]).optional(),
  title: z.string({ error: "Enter a title." }).trim().min(1, "Enter a title.").max(TITLE_MAX, `Use at most ${TITLE_MAX} characters.`),
  message: z
    .string({ error: "Enter the message." })
    .transform((v) => v.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(1, "Enter the message.").max(MESSAGE_MAX, `Use at most ${MESSAGE_MAX} characters.`)),
  published: z
    .literal("on")
    .optional()
    .transform((v) => v === "on"),
});

export const deleteNotificationSchema = z.object({ notificationId: objectId });
