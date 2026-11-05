"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import type { AdminActionResult } from "@/features/organization/admin/actions";
import { quoted } from "@/features/account/activity/constants";
import { recordActivity } from "@/features/account/activity/mutations";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { updateUserGroup } from "@/features/account/users/mutations";
import { formValues, type FormState } from "@/lib/utils/form";
import { createGroup, deleteGroup, renameGroup } from "./mutations";
import { findGroup } from "./queries";
import { deleteGroupSchema, saveGroupSchema, setUserGroupSchema } from "./validation";

export type GroupFormState = (NonNullable<FormState<"name">> & { saved?: true }) | undefined;

/** Creates a group, or renames one when the form has a `groupId`. Super-admins only. */
export async function saveGroup(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  const admin = await requireSuperAdmin();
  const parsed = saveGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };

  const { groupId, name } = parsed.data;
  const before = groupId ? await findGroup(new ObjectId(groupId)) : null;
  const result = groupId ? await renameGroup(new ObjectId(groupId), name) : await createGroup(name);
  if (!result.ok) {
    const message = result.reason === "name_taken" ? "A group with this name already exists." : "This group no longer exists.";
    return { errors: { name: [message] }, values: formValues(formData) };
  }
  await recordActivity(
    admin.id,
    "admin",
    groupId ? `Renamed the group ${before ? `${quoted(before.name)} to ` : ""}${quoted(name)}` : `Created the group ${quoted(name)}`,
  );
  refresh();
  return { saved: true };
}

/** Deletes a group without members, and its schedules. Super-admins only. */
export async function removeGroup(groupId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireSuperAdmin();
  const parsed = deleteGroupSchema.safeParse({ groupId });
  if (!parsed.success) return { ok: false, message: "This group no longer exists." };
  const group = await findGroup(new ObjectId(parsed.data.groupId));
  const result = await deleteGroup(new ObjectId(parsed.data.groupId));
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === "has_members"
          ? "Only groups without members can be deleted. Move its members to other groups first."
          : "This group no longer exists.",
    };
  }
  const n = result.schedules;
  const schedules = n ? ` and its ${n} ${n === 1 ? "schedule" : "schedules"}` : "";
  await recordActivity(admin.id, "admin", `Deleted the group${group ? ` ${quoted(group.name)}` : ""}${schedules}`);
  refresh();
  return { ok: true, message: n ? `Group and its ${n} ${n === 1 ? "schedule" : "schedules"} deleted.` : "Group deleted." };
}

/** Puts a user in a group, or none. Super-admins only. */
export async function setUserGroup(_prev: AdminActionResult, formData: FormData): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = setUserGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "That request wasn't valid. Reload the page and try again." };

  const groupId = parsed.data.groupId ? new ObjectId(parsed.data.groupId) : null;
  const group = groupId ? await findGroup(groupId) : null;
  if (groupId && !group) return { ok: false, message: "That group no longer exists." };
  const user = await updateUserGroup(new ObjectId(parsed.data.userId), groupId);
  if (!user) return { ok: false, message: "That account no longer exists." };

  refresh();
  const name = user.profile?.displayName ?? user.email;
  const who = user.profile ? `@${user.profile.displayName}` : user.email;
  await recordActivity(admin.id, "admin", group ? `Put ${who} in the group ${quoted(group.name)}` : `Took ${who} out of their group`);
  return { ok: true, message: group ? `${name} is now in ${group.name}.` : `${name} is no longer in a group.` };
}
