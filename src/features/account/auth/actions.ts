"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivity } from "@/features/account/activity/mutations";
import { COMPLETE_PROFILE_PATH } from "@/features/account/profile/constants";
import { flashSnackbar } from "@/features/shared/snackbar/flash";
import { createUser, ensureFounder } from "@/features/account/users/mutations";
import { findUserByEmail, findUserById, isActive } from "@/features/account/users/queries";
import { formValues, type FormState } from "@/lib/utils/form";
import { HOME_PATH, SIGN_IN_PATH } from "./constants";
import { getDummyHash, hashPassword, verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";
import { getCurrentUser } from "./dal";
import { signInSchema, signUpSchema } from "./validation";

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  }

  const { password, ...profile } = parsed.data;
  const result = await createUser({ ...profile, passwordHash: await hashPassword(password) });
  if (!result.ok) {
    return { errors: { email: ["An account with this email already exists."] }, values: formValues(formData) };
  }

  await recordActivity(result.user._id, "account", "Created an account");

  // The first account on a new database becomes the founder and is active straight away.
  await ensureFounder();
  const user = await findUserById(result.user._id);
  if (!user || !isActive(user)) {
    await flashSnackbar({
      type: "info",
      title: "Account created",
      message: "An administrator must activate your account before you can sign in.",
    });
    redirect(SIGN_IN_PATH);
  }

  await createSession(user._id);
  await flashSnackbar({ type: "success", message: "Your account has been created. Complete your profile to continue." });
  redirect(COMPLETE_PROFILE_PATH);
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  }

  // Promotes the oldest account if the site has no founder yet (e.g. a database from before roles).
  await ensureFounder();
  const user = await findUserByEmail(parsed.data.email);
  // Always run a hash check so response time doesn't reveal whether the email is registered.
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !passwordOk) {
    return { errors: { form: ["Invalid email or password."] }, values: formValues(formData) };
  }
  // Only reported once the password matched, so it doesn't reveal which emails are registered.
  if (!isActive(user)) {
    return {
      errors: { form: ["Your account is waiting for activation. An administrator must activate it before you can sign in."] },
      values: formValues(formData),
    };
  }

  await createSession(user._id);
  await recordActivity(user._id, "account", "Signed in");
  if (!user.profile?.completedAt) {
    await flashSnackbar({ type: "info", message: "Complete your profile to continue." });
    redirect(COMPLETE_PROFILE_PATH);
  }
  await flashSnackbar({ type: "success", message: "Signed in successfully." });
  redirect(HOME_PATH);
}

export async function signOut() {
  // Before the session goes, to know who it was.
  const user = await getCurrentUser();
  if (user) await recordActivity(user.id, "account", "Signed out");
  await deleteSession();
  await flashSnackbar({ type: "info", message: "You've been signed out." });
  redirect(SIGN_IN_PATH);
}
