"use client";

import { useActionState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsFormField } from "@/components/ui/ps-form-field";
import { signIn } from "../actions";

export function PsSignInForm() {
  const [state, action, pending] = useActionState(signIn, undefined);

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
        autoComplete="current-password"
        required
        errors={state?.errors?.password}
      />
      <PsButton type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </PsButton>
    </form>
  );
}
