import "server-only";
import { ObjectId } from "mongodb";
import type { PublicUser } from "@/features/account/users/types";
import { listGroups } from "@/features/organization/groups/queries";
import type { Group } from "@/features/organization/groups/types";
import { seekerAccess } from "./access";
import { NO_GROUP } from "./constants";
import type { SeekerScope } from "./queries";

/** Whose bids a Seeker view covers. Pages and route handlers both use this, so they agree. */
export type SeekerView =
  | { mode: "upload"; userId: ObjectId }
  | { mode: "group" | "all"; founder: boolean; groups: Group[]; group: string | null; scope: SeekerScope; seeker: string | null };

/**
 * Resolves the viewer's Seeker view from the `group` and `seeker` params: a job seeker sees
 * their own; a Profile Manager their group (`group` ignored); a founder every group, one group
 * or `none` (an unknown group falls back to all). Null when they have no Seeker view.
 */
export async function resolveSeekerView(user: PublicUser, params: { group?: string | null; seeker?: string | null }): Promise<SeekerView | null> {
  const access = seekerAccess(user);
  if (access.mode === "upload") return { mode: "upload", userId: new ObjectId(user.id) };
  const seeker = params.seeker || null;
  if (access.mode === "group") {
    if (!access.groupId) return null;
    return { mode: "group", founder: false, groups: [], group: null, scope: { groupId: new ObjectId(access.groupId) }, seeker };
  }
  if (access.mode !== "all") return null;
  const groups = await listGroups();
  const wanted = params.group || null;
  const group = wanted === NO_GROUP || groups.some((g) => g.id === wanted) ? wanted : null;
  const scope: SeekerScope = group === NO_GROUP ? { groupId: null } : group ? { groupId: new ObjectId(group) } : {};
  return { mode: "all", founder: true, groups, group, scope, seeker };
}
