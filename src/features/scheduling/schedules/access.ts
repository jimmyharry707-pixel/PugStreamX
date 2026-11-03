import "server-only";
import { ObjectId } from "mongodb";
import { isCaller, isDeveloper, isProfileManager } from "@/features/account/users/roles";
import type { PublicUser } from "@/features/account/users/types";
import type { CalendarMode } from "./types";

/**
 * Who may use which calendar. Profile Managers, Callers and Developers use their own group's
 * calendar (and nothing else); Developers see only its schedules that need a tech supporter.
 * Super-admins may view any group's (`requestedGroupId`). Everyone else, and members of those
 * roles without a group, get no calendar.
 */
export type CalendarAccess =
  | { mode: CalendarMode; groupId: ObjectId }
  /** A super-admin who hasn't picked a group (or there are none). */
  | { mode: "view"; groupId: null }
  | { mode: "none"; reason: "role" | "group" };

export function calendarAccess(user: PublicUser, requestedGroupId?: string | null): CalendarAccess {
  const mode: CalendarMode | null = isProfileManager(user.role) ? "manage" : isCaller(user.role) ? "call" : isDeveloper(user.role) ? "support" : null;
  if (mode) {
    if (!user.groupId) return { mode: "none", reason: "group" };
    return { mode, groupId: new ObjectId(user.groupId) };
  }
  if (user.isSuperAdmin) {
    return { mode: "view", groupId: requestedGroupId && /^[a-f0-9]{24}$/i.test(requestedGroupId) ? new ObjectId(requestedGroupId) : null };
  }
  return { mode: "none", reason: "role" };
}

/** Developers ("support") only ever get schedules that need a tech supporter. */
export const techSupportOnly = (access: CalendarAccess) => access.mode === "support";
