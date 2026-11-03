"use client";

import { useActionState, useEffect, useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsInput } from "@/components/ui/ps-input";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { saveCallerFields } from "../actions";
import { NOTE_MAX, URL_MAX } from "../constants";
import type { Schedule } from "../types";

type Intent = "save" | "done" | "reopen";

const PENDING: Record<Intent, string> = { save: "Saving…", done: "Marking done…", reopen: "Undoing…" };

/**
 * A Caller's part of a schedule, in its details: the screen share link (only while the Profile
 * Manager requires one) and "Note (Caller)". The link goes in before the interview, the note
 * after; then **Done** marks the schedule done (both must be filled in), shown on the calendar.
 * "Undo done" takes that back. Calls `onSaved` with the updated schedule.
 */
export function PsCallerForm({ schedule, onSaved }: { schedule: Schedule; onSaved: (schedule: Schedule) => void }) {
  const [state, action, pending] = useActionState(saveCallerFields, undefined);
  const [intent, setIntent] = useState<Intent>("save");
  const values = state?.values ?? { screenShareUrl: schedule.screenShareUrl ?? "", callerNote: schedule.callerNote ?? "" };
  const errors = state?.errors ?? {};
  const done = !!schedule.doneAt;

  useEffect(() => {
    if (state?.saved) onSaved(state.saved);
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Each button sends its `intent`; remember which one, for its "…ing" label.
  const button = (value: Intent, label: string, variant: "primary" | "secondary") => (
    <PsButton type="submit" name="intent" value={value} variant={variant} size="sm" disabled={pending} onClick={() => setIntent(value)} className="min-w-24">
      {pending && intent === value ? PENDING[value] : label}
    </PsButton>
  );

  return (
    <form action={action} noValidate aria-label="Caller" className="space-y-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
      <input type="hidden" name="scheduleId" value={schedule.id} />
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Caller</p>
      {errors.form && <PsAlert>{errors.form[0]}</PsAlert>}
      {state?.message && !errors.form && <PsAlert variant="success">{state.message}</PsAlert>}
      {schedule.screenShareRequired && (
        <PsField id="callerScreenShareUrl" label="Screen share link" errors={errors.screenShareUrl} hint="Required for this schedule. Add it before the interview.">
          {(p) => (
            <PsInput name="screenShareUrl" type="url" inputMode="url" maxLength={URL_MAX} placeholder="https://" defaultValue={values.screenShareUrl} {...p} />
          )}
        </PsField>
      )}
      <PsField id="callerNote" label="Note (Caller)" errors={errors.callerNote} hint={done ? undefined : "Add it after the interview, then click Done."}>
        {(p) => <PsTextarea name="callerNote" rows={3} maxLength={NOTE_MAX} defaultValue={values.callerNote} {...p} />}
      </PsField>
      {/* Enter in a field clicks the first button in the markup, so Save always comes first there. */}
      <div className="flex flex-wrap justify-end gap-2">
        {done ? (
          <>
            {button("save", "Save", "primary")}
            <span className="order-first">{button("reopen", "Undo done", "secondary")}</span>
          </>
        ) : (
          <>
            {button("save", "Save", "secondary")}
            {button("done", "Done", "primary")}
          </>
        )}
      </div>
    </form>
  );
}
