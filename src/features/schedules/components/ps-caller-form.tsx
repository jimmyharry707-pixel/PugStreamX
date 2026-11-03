"use client";

import { useActionState, useEffect } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsInput } from "@/components/ui/ps-input";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { saveCallerFields } from "../actions";
import { NOTE_MAX, URL_MAX } from "../constants";
import type { Schedule } from "../types";

/**
 * A Caller's part of a schedule, in its details: the screen share link (only while the Profile
 * Manager requires one) and "Note (Caller)". Calls `onSaved` with the updated schedule.
 */
export function PsCallerForm({ schedule, onSaved }: { schedule: Schedule; onSaved: (schedule: Schedule) => void }) {
  const [state, action, pending] = useActionState(saveCallerFields, undefined);
  const values = state?.values ?? { screenShareUrl: schedule.screenShareUrl ?? "", callerNote: schedule.callerNote ?? "" };
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.saved) onSaved(state.saved);
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} noValidate aria-label="Caller" className="space-y-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
      <input type="hidden" name="scheduleId" value={schedule.id} />
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Caller</p>
      {errors.form && <PsAlert>{errors.form[0]}</PsAlert>}
      {state?.saved && !errors.form && <PsAlert variant="success">Saved.</PsAlert>}
      {schedule.screenShareRequired && (
        <PsField id="callerScreenShareUrl" label="Screen share link" errors={errors.screenShareUrl} hint="Required for this schedule.">
          {(p) => (
            <PsInput name="screenShareUrl" type="url" inputMode="url" maxLength={URL_MAX} placeholder="https://" defaultValue={values.screenShareUrl} {...p} />
          )}
        </PsField>
      )}
      <PsField id="callerNote" label="Note (Caller)" errors={errors.callerNote}>
        {(p) => <PsTextarea name="callerNote" rows={3} maxLength={NOTE_MAX} defaultValue={values.callerNote} {...p} />}
      </PsField>
      <div className="flex justify-end">
        <PsButton type="submit" size="sm" disabled={pending} className="min-w-24">
          {pending ? "Saving…" : "Save"}
        </PsButton>
      </div>
    </form>
  );
}
