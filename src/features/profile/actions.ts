"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { z } from "zod";
import { HOME_PATH, SIGN_IN_PATH } from "@/features/auth/constants";
import { getCurrentUser, requireCompleteProfile } from "@/features/auth/dal";
import { flashSnackbar } from "@/features/snackbar/flash";
import { setUserProfile, updateUserProfile } from "@/features/users/mutations";
import { findUserById } from "@/features/users/queries";
import { formValues, type FormState } from "@/lib/utils/form";
import { deleteAvatar, readAvatarUpload, saveAvatar } from "./avatar";
import { COMPLETE_PROFILE_PATH, PROFILE_PATH, type ProfileField } from "./constants";
import { profileSchema } from "./validation";

export async function completeProfile(_prev: FormState<ProfileField>, formData: FormData): Promise<FormState<ProfileField>> {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);
  if (user.profileComplete) redirect(HOME_PATH);

  // Validate everything first so all errors show at once.
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  const avatar = await readAvatarUpload(formData.get("avatar"));
  if (!parsed.success || !avatar.ok) {
    return {
      errors: {
        ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors),
        ...(avatar.ok ? {} : { avatar: [avatar.error] }),
      },
      values: formValues(formData),
    };
  }

  const userId = new ObjectId(user.id);
  const avatarId = await saveAvatar(userId, avatar.bytes, avatar.contentType);
  const { displayName, ...rest } = parsed.data;
  const result = await setUserProfile(userId, {
    ...rest,
    avatarId,
    displayName,
    displayNameKey: displayName.toLowerCase(),
    completedAt: new Date(),
  });

  if (!result.ok) {
    await deleteAvatar(avatarId);
    if (result.reason === "already_complete") redirect(HOME_PATH);
    return { errors: { displayName: ["That display name is already taken."] }, values: formValues(formData) };
  }

  await flashSnackbar({ type: "success", message: "Your profile is complete. Welcome to PugStreamX!" });
  redirect(HOME_PATH);
}

/** Edits a completed profile. The avatar is optional here: without a new file the current one is kept. */
export async function updateProfile(_prev: FormState<ProfileField>, formData: FormData): Promise<FormState<ProfileField>> {
  const user = await requireCompleteProfile();

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  const entry = formData.get("avatar");
  const hasNewAvatar = entry instanceof File && entry.size > 0;
  const avatar = hasNewAvatar ? await readAvatarUpload(entry) : null;
  if (!parsed.success || (avatar && !avatar.ok)) {
    return {
      errors: {
        ...(parsed.success ? {} : z.flattenError(parsed.error).fieldErrors),
        ...(avatar && !avatar.ok ? { avatar: [avatar.error] } : {}),
      },
      values: formValues(formData),
    };
  }

  const userId = new ObjectId(user.id);
  const previous = await findUserById(userId);
  const newAvatarId = avatar?.ok ? await saveAvatar(userId, avatar.bytes, avatar.contentType) : undefined;
  const { displayName, ...rest } = parsed.data;
  const result = await updateUserProfile(userId, {
    ...rest,
    displayName,
    displayNameKey: displayName.toLowerCase(),
    avatarId: newAvatarId,
  });

  if (!result.ok) {
    if (newAvatarId) await deleteAvatar(newAvatarId);
    if (result.reason === "not_found") redirect(COMPLETE_PROFILE_PATH);
    return { errors: { displayName: ["That display name is already taken."] }, values: formValues(formData) };
  }

  // Only remove the old photo once the new one is saved on the profile.
  if (newAvatarId && previous?.profile?.avatarId) await deleteAvatar(previous.profile.avatarId);

  await flashSnackbar({ type: "success", message: "Your profile has been updated." });
  redirect(PROFILE_PATH);
}
