import "server-only";
import { z } from "zod";
import { GROUP_NAME_MAX } from "./constants";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

export const groupNameSchema = z
  .string({ error: "Enter a group name." })
  .trim()
  .min(1, "Enter a group name.")
  .max(GROUP_NAME_MAX, `Use at most ${GROUP_NAME_MAX} characters.`);

/** Create (no `groupId`) or rename (with one). */
export const saveGroupSchema = z.object({ groupId: z.union([z.literal(""), objectId]).optional(), name: groupNameSchema });

export const deleteGroupSchema = z.object({ groupId: objectId });

/** A user's group: "none" or a group id. */
export const setUserGroupSchema = z.object({
  userId: objectId,
  groupId: z.union([z.literal("none").transform(() => null), objectId]),
});
