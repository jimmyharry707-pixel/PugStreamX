"use client";

import { useActionState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsFormField } from "@/components/ui/ps-form-field";
import { signUp } from "../actions";
import { PASSWORD_MIN_LENGTH } from "../constants";

export function PsSignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.errors?.form && <PsAlert>{state.errors.form[0]}</PsAlert>}
      <PsFormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />
      <PsFormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        errors={state?.errors?.password}
      />
      <PsButton type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </PsButton>
    </form>
  );
}
