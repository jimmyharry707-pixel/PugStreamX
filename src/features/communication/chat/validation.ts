import "server-only";
import { z } from "zod";
import { MESSAGE_MAX } from "./constants";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

/** A message to send. Line breaks from a textarea (\r\n) are stored as plain \n. */
export const messageSchema = z.object({
  to: objectId,
  text: z
    .string()
    .transform((v) => v.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(1, "Write a message.").max(MESSAGE_MAX, `Use at most ${MESSAGE_MAX} characters.`)),
});

export const memberIdSchema = objectId;
