import "server-only";
import { ObjectId } from "mongodb";
import { isCaller, isProfileManager } from "@/features/account/users/roles";
import type { PublicUser } from "@/features/account/users/types";
import type { CalendarMode } from "./types";

/**
 * Who may use which calendar. Profile Managers and Callers use their own group's calendar (and
 * nothing else); super-admins may view any group's (`requestedGroupId`). Everyone else, and
 * Profile Managers or Callers without a group, get no calendar.
 */
export type CalendarAccess =
  | { mode: CalendarMode; groupId: ObjectId }
  /** A super-admin who hasn't picked a group (or there are none). */
  | { mode: "view"; groupId: null }
  | { mode: "none"; reason: "role" | "group" };

export function calendarAccess(user: PublicUser, requestedGroupId?: string | null): CalendarAccess {
  if (isProfileManager(user.role) || isCaller(user.role)) {
    if (!user.groupId) return { mode: "none", reason: "group" };
    return { mode: isProfileManager(user.role) ? "manage" : "call", groupId: new ObjectId(user.groupId) };
  }
  if (user.isSuperAdmin) {
    return { mode: "view", groupId: requestedGroupId && /^[a-f0-9]{24}$/i.test(requestedGroupId) ? new ObjectId(requestedGroupId) : null };
  }
  return { mode: "none", reason: "role" };
}
