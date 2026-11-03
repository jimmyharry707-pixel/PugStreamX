"use client";

import { useActionState, useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsFormField } from "@/components/ui/ps-form-field";
import { PsPhoneInput } from "@/components/ui/ps-phone-input";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { completeProfile, updateProfile } from "../actions";
import { ADDRESS_MAX, DISPLAY_NAME_MAX, DISPLAY_NAME_MIN, FULL_NAME_MAX } from "../constants";
import type { ProfileFormInitial } from "../queries";
import { PsAvatarInput, type AvatarValue } from "./ps-avatar-input";

// To add a profile field: add it to profileSchema (validation.ts), PROFILE_FIELDS (constants.ts),
// UserProfile (features/users/types.ts), and an input here.

/**
 * "complete": first-time setup at /complete-profile (photo required).
 * "update": editing at /profile, pre-filled from `initial` (a new photo is optional).
 */
export function PsProfileForm({ mode = "complete", initial }: { mode?: "complete" | "update"; initial?: ProfileFormInitial }) {
  const [state, formAction, pending] = useActionState(mode === "update" ? updateProfile : completeProfile, undefined);
  // Kept in state (not just the DOM) so they survive React's form reset after a failed submit.
  const [avatar, setAvatar] = useState<AvatarValue>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [phone, setPhone] = useState(initial?.phone ?? "");

  const errors = state?.errors;
  // After a failed submit, show what was typed; otherwise the saved values (update mode).
  const values: Partial<Record<string, string>> = state?.values ?? initial ?? {};

  return (
    <form
      action={(formData) => {
        if (avatar) formData.set("avatar", avatar.file);
        formAction(formData);
      }}
      className="space-y-4"
      noValidate
    >
      {errors?.form && <PsAlert>{errors.form[0]}</PsAlert>}

      <PsField id="avatar" label="Profile photo" errors={avatarError ? [avatarError] : errors?.avatar}>
        {(control) => <PsAvatarInput value={avatar} currentUrl={initial?.avatarUrl} onChange={setAvatar} onError={setAvatarError} {...control} />}
      </PsField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PsFormField
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={FULL_NAME_MAX}
          defaultValue={values.fullName}
          errors={errors?.fullName}
        />
        <PsFormField
          label="Display name"
          name="displayName"
          autoComplete="username"
          required
          minLength={DISPLAY_NAME_MIN}
          maxLength={DISPLAY_NAME_MAX}
          hint="Unique. Letters, numbers, . - _"
          defaultValue={values.displayName}
          errors={errors?.displayName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PsFormField
          label="Birthday"
          name="birthday"
          type="date"
          autoComplete="bday"
          required
          defaultValue={values.birthday}
          errors={errors?.birthday}
        />
        <PsField id="phone" label="Phone number" errors={errors?.phone}>
          {(control) => <PsPhoneInput name="phone" value={phone} onChange={setPhone} {...control} />}
        </PsField>
      </div>

      <PsField id="address" label="Address" errors={errors?.address}>
        {(control) => (
          <PsTextarea
            name="address"
            autoComplete="street-address"
            required
            maxLength={ADDRESS_MAX}
            defaultValue={values.address}
            {...control}
          />
        )}
      </PsField>

      <PsButton type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : mode === "update" ? "Save changes" : "Save and continue"}
      </PsButton>
    </form>
  );
}
