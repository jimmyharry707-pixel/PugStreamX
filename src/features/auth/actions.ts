"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createUser } from "@/features/users/mutations";
import { findUserByEmail } from "@/features/users/queries";
import { HOME_PATH, SIGN_IN_PATH } from "./constants";
import { getDummyHash, hashPassword, verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";
import { signInSchema, signUpSchema } from "./validation";

/** State returned to the auth forms through useActionState. */
export type AuthFormState<Field extends string = string> =
  | {
      /** Errors per field, plus `form` for errors that aren't about one field. */
      errors?: Partial<Record<Field | "form", string[]>>;
      /** Submitted values to refill the form. Never includes passwords. */
      values?: Partial<Record<Field, string>>;
    }
  | undefined;

/** Echoes submitted values back to the form, minus anything secret. */
function keepValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.toLowerCase().includes("password") && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return values;
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: keepValues(formData) };
  }

  const { password, ...profile } = parsed.data;
  const result = await createUser({ ...profile, passwordHash: await hashPassword(password) });
  if (!result.ok) {
    return { errors: { email: ["An account with this email already exists."] }, values: keepValues(formData) };
  }

  await createSession(result.user._id);
  redirect(HOME_PATH);
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: keepValues(formData) };
  }

  const user = await findUserByEmail(parsed.data.email);
  // Always run a hash check so response time doesn't reveal whether the email is registered.
  const passwordOk = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !passwordOk) {
    return { errors: { form: ["Invalid email or password."] }, values: keepValues(formData) };
  }

  await createSession(user._id);
  redirect(HOME_PATH);
}

export async function signOut() {
  await deleteSession();
  redirect(SIGN_IN_PATH);
}
