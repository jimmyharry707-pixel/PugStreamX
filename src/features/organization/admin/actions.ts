"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { deleteUserSessions } from "@/features/account/auth/session";
import { deleteAvatar } from "@/features/account/profile/avatar";
import { flashSnackbar } from "@/features/shared/snackbar/flash";
import { deleteUser, updateUserActive, updateUserRole } from "@/features/account/users/mutations";
import { roleLabel } from "@/features/account/users/roles";
import { ADMIN_USERS_PATH } from "./constants";
import { deleteUserSchema, setUserActiveSchema, setUserRoleSchema } from "./validation";

export type AdminActionResult = { ok: boolean; message: string } | undefined;

const INVALID = { ok: false, message: "That request wasn't valid. Reload the page and try again." };

/** Activates or deactivates another account. Deactivating also signs that user out everywhere. */
export async function setUserActive(_prev: AdminActionResult, formData: FormData): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = setUserActiveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return INVALID;
  const { userId, active } = parsed.data;
  if (userId === admin.id) return { ok: false, message: "You can't change your own account." };

  const id = new ObjectId(userId);
  const result = await updateUserActive(id, active);
  if (!result.ok) {
    return {
      ok: false,
      message: result.reason === "founder" ? "A founder's account can't be deactivated." : "That account no longer exists.",
    };
  }
  if (!active) await deleteUserSessions(id);

  // Re-render the list with the new status.
  refresh();
  const name = result.user.profile?.displayName ?? result.user.email;
  return { ok: true, message: active ? `${name} can now sign in.` : `${name} has been deactivated and signed out.` };
}

/** Changes another account's role. Your own role can't be changed, so a super-admin always remains. */
export async function setUserRole(_prev: AdminActionResult, formData: FormData): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = setUserRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return INVALID;
  const { userId, role } = parsed.data;
  if (userId === admin.id) return { ok: false, message: "You can't change your own role." };

  const result = await updateUserRole(new ObjectId(userId), role);
  if (!result.ok) return { ok: false, message: "That account no longer exists." };

  refresh();
  const name = result.user.profile?.displayName ?? result.user.email;
  return { ok: true, message: `${name}'s role is now ${roleLabel(role)}.` };
}

/**
 * Permanently deletes another account: the user, their sessions and their avatar. Founders
 * can't be deleted. On success, closes the profile dialog by going back to the list.
 */
export async function removeUser(_prev: AdminActionResult, formData: FormData): Promise<AdminActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = deleteUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return INVALID;
  if (parsed.data.userId === admin.id) return { ok: false, message: "You can't delete your own account." };

  const id = new ObjectId(parsed.data.userId);
  const result = await deleteUser(id);
  if (!result.ok) {
    return {
      ok: false,
      message: result.reason === "founder" ? "A founder can't be deleted. Change their role first." : "That account no longer exists.",
    };
  }
  await deleteUserSessions(id);
  if (result.user.profile?.avatarId) await deleteAvatar(result.user.profile.avatarId);

  const name = result.user.profile?.displayName ?? result.user.email;
  await flashSnackbar({ type: "success", message: `${name}'s account has been deleted.` });
  redirect(ADMIN_USERS_PATH);
}
