// Shared by the client and the server. Keep free of server-only imports.
import { isJobSeeker, isProfileManager, isSuperAdmin } from "@/features/account/users/roles";

/**
 * What a member gets on the Seeker page:
 * - `"upload"`: Job seekers (role 4) see their own bid counts and upload work results.
 * - `"group"`: Profile Managers (role 1) see the bids of the job seekers in their group
 *   (`groupId`; null when they have no group yet) and can open their files.
 * - `"all"`: Founders see every job seeker's bids, in every group (or none), and pick a group
 *   and a job seeker.
 * - `"none"`: everyone else (Callers, Developers, no role); the left-panel tab is disabled.
 */
export type SeekerAccess = { mode: "upload" } | { mode: "group"; groupId: string | null } | { mode: "all" } | { mode: "none" };

export function seekerAccess(user: { role: number | null; groupId: string | null }): SeekerAccess {
  if (isJobSeeker(user.role)) return { mode: "upload" };
  if (isProfileManager(user.role)) return { mode: "group", groupId: user.groupId };
  if (isSuperAdmin(user.role)) return { mode: "all" };
  return { mode: "none" };
}
