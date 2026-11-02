import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./constants";

// To add a sign-up field: add it to signUpSchema, add an input to ps-sign-up-form.tsx,
// and store it in the signUp action (src/features/auth/actions.ts) and UserDoc.

const email = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(254, "Email address is too long.")
  .pipe(z.email("Enter a valid email address."));

export const signUpSchema = z.object({
  email,
  password: z
    .string({ error: "Enter a password." })
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`),
});

export const signInSchema = z.object({
  email,
  password: z
    .string({ error: "Enter your password." })
    .min(1, "Enter your password.")
    .max(PASSWORD_MAX_LENGTH, "Invalid email or password."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
