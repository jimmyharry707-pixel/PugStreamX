import "server-only";
import { z } from "zod";
import { isRole } from "@/features/account/users/roles";

const userId = z.string().regex(/^[a-f0-9]{24}$/i);

export const setUserActiveSchema = z.object({
  userId,
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

/** `role` is "none" (no role) or a role number from ROLES. */
export const setUserRoleSchema = z.object({
  userId,
  role: z.union([
    z.literal("none").transform(() => null),
    z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine(isRole, "Choose a role from the list."),
  ]),
});

export const deleteUserSchema = z.object({ userId });
