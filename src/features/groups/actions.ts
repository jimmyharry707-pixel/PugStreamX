"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import type { AdminActionResult } from "@/features/admin/actions";
import { requireSuperAdmin } from "@/features/auth/dal";
import { updateUserGroup } from "@/features/users/mutations";
import { formValues, type FormState } from "@/lib/utils/form";
import { createGroup, deleteGroup, renameGroup } from "./mutations";
import { findGroup } from "./queries";
import { deleteGroupSchema, saveGroupSchema, setUserGroupSchema } from "./validation";

export type GroupFormState = (NonNullable<FormState<"name">> & { saved?: true }) | undefined;

/** Creates a group, or renames one when the form has a `groupId`. Super-admins only. */
export async function saveGroup(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  await requireSuperAdmin();
  const parsed = saveGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };

  const { groupId, name } = parsed.data;
  const result = groupId ? await renameGroup(new ObjectId(groupId), name) : await createGroup(name);
  if (!result.ok) {
    const message = result.reason === "name_taken" ? "A group with this name already exists." : "This group no longer exists.";
    return { errors: { name: [message] }, values: formValues(formData) };
  }
  refresh();
  return { saved: true };
}

/** Deletes an empty group. Super-admins only. */
export async function removeGroup(groupId: string): Promise<{ ok: boolean; message: string }> {
  await requireSuperAdmin();
  const parsed = deleteGroupSchema.safeParse({ groupId });
  if (!parsed.success) return { ok: false, message: "This group no longer exists." };
  const result = await deleteGroup(new ObjectId(parsed.data.groupId));
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === "not_empty"
          ? "Only empty groups can be deleted. Move its members to other groups and delete its schedules first."
          : "This group no longer exists.",
    };
  }
  refresh();
  return { ok: true, message: "Group deleted." };
}

/** Puts a user in a group, or none. Super-admins only. */
export async function setUserGroup(_prev: AdminActionResult, formData: FormData): Promise<AdminActionResult> {
  await requireSuperAdmin();
  const parsed = setUserGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "That request wasn't valid. Reload the page and try again." };

  const groupId = parsed.data.groupId ? new ObjectId(parsed.data.groupId) : null;
  const group = groupId ? await findGroup(groupId) : null;
  if (groupId && !group) return { ok: false, message: "That group no longer exists." };
  const user = await updateUserGroup(new ObjectId(parsed.data.userId), groupId);
  if (!user) return { ok: false, message: "That account no longer exists." };

  refresh();
  const name = user.profile?.displayName ?? user.email;
  return { ok: true, message: group ? `${name} is now in ${group.name}.` : `${name} is no longer in a group.` };
}
