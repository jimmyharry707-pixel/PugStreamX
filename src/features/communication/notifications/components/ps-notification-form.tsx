"use client";

import { useActionState, useEffect } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsFormField } from "@/components/ui/ps-form-field";
import { PsSwitch } from "@/components/ui/ps-switch";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { saveNotification } from "../actions";
import { MESSAGE_MAX, TITLE_MAX } from "../constants";
import type { Notification } from "../types";

/** Write a notification, or edit `notification`. Calls `onSaved` once saved. */
export function PsNotificationForm({ notification, onSaved, onCancel }: { notification?: Notification; onSaved: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(saveNotification, undefined);
  const values = state?.values;

  useEffect(() => {
    if (state?.saved) onSaved();
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} noValidate className="space-y-4">
      {notification && <input type="hidden" name="notificationId" value={notification.id} />}
      <PsFormField
        label="Title"
        name="title"
        required
        maxLength={TITLE_MAX}
        autoComplete="off"
        defaultValue={values?.title ?? notification?.title}
        errors={state?.errors?.title}
      />
      <PsField id="message" label="Message" errors={state?.errors?.message} hint="Plain text. Links (http/https) become clickable.">
        {(p) => <PsTextarea name="message" rows={7} maxLength={MESSAGE_MAX} defaultValue={values?.message ?? notification?.message} {...p} />}
      </PsField>
      <PsSwitch
        id="published"
        name="published"
        label="Published"
        hint="Members see published notifications in the topbar bell, and in a popup when they arrive."
        defaultChecked={values ? values.published === "on" : (notification?.published ?? true)}
      />
      {state?.errors?.form && <PsAlert>{state.errors.form[0]}</PsAlert>}
      <div className="flex justify-end gap-2">
        <PsButton type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </PsButton>
        <PsButton type="submit" size="sm" disabled={pending} className="min-w-24">
          {pending ? "Saving…" : notification ? "Save" : "Create"}
        </PsButton>
      </div>
    </form>
  );
}
