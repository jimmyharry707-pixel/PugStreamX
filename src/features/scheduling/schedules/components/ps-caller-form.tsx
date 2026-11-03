"use client";

import { useActionState, useEffect, useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsInput } from "@/components/ui/ps-input";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { saveCallerFields } from "../actions";
import { NOTE_MAX, URL_MAX } from "../constants";
import type { CallerIntent as Intent, Schedule } from "../types";
import { useStarted } from "../use-started";

const PENDING: Record<Intent, string> = { save: "Saving…", done: "Marking done…", reopen: "Undoing…" };

/** The part of the form each button's success message belongs to (it's hidden elsewhere). */
const MESSAGE_PHASE: Record<Intent, Phase> = { save: "before", done: "done", reopen: "after" };

type Phase = "before" | "after" | "done";

/**
 * A Caller's part of a schedule, in its details. It follows the interview's start (an interview
 * may finish early, so the Caller can wrap up as soon as it has started):
 * - before it starts: only the screen share link (when the Profile Manager requires one) and Save;
 * - once it has started: only "Note (Caller)" and **Done**, which marks the schedule done (shown
 *   on the calendar);
 * - once done: Undo done.
 * The server (`saveCallerFields`) enforces the same. Calls `onSaved` with the updated schedule.
 */
export function PsCallerForm({ schedule, onSaved }: { schedule: Schedule; onSaved: (schedule: Schedule) => void }) {
  const [state, action, pending] = useActionState(saveCallerFields, undefined);
  const [intent, setIntent] = useState<Intent>("save");
  // An open form switches to the note the moment the interview starts.
  const started = useStarted(schedule.start);
  const values = state?.values ?? { screenShareUrl: schedule.screenShareUrl ?? "", callerNote: schedule.callerNote ?? "" };
  const errors = state?.errors ?? {};
  const phase: Phase = schedule.doneAt ? "done" : started ? "after" : "before";
  // E.g. "Saved." from adding the link isn't shown under the note once the interview starts.
  const message = state?.message && state.intent && MESSAGE_PHASE[state.intent] === phase ? state.message : null;

  useEffect(() => {
    if (state?.saved) onSaved(state.saved);
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Each button sends its `intent`; remember which one, for its "…ing" label.
  const button = (value: Intent, label: string, variant: "primary" | "secondary" = "primary") => (
    <div className="flex justify-end">
      <PsButton type="submit" name="intent" value={value} variant={variant} size="sm" disabled={pending} onClick={() => setIntent(value)} className="min-w-24">
        {pending && intent === value ? PENDING[value] : label}
      </PsButton>
    </div>
  );

  return (
    <form action={action} noValidate aria-label="Caller" data-phase={phase} className="space-y-4 rounded-xl border border-white/10 bg-gray-950/40 p-4">
      <input type="hidden" name="scheduleId" value={schedule.id} />
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Caller</p>
      {errors.form && <PsAlert>{errors.form[0]}</PsAlert>}
      {message && !errors.form && <PsAlert variant="success">{message}</PsAlert>}

      {phase === "before" &&
        (schedule.screenShareRequired ? (
          <>
            <PsField id="callerScreenShareUrl" label="Screen share link" errors={errors.screenShareUrl} hint="Required for this schedule. Add it before the interview.">
              {(p) => (
                <PsInput name="screenShareUrl" type="url" inputMode="url" maxLength={URL_MAX} placeholder="https://" defaultValue={values.screenShareUrl} {...p} />
              )}
            </PsField>
            {button("save", "Save")}
          </>
        ) : (
          <p className="text-sm text-gray-400">Nothing to add before the interview. Once it starts, add your note here and click Done.</p>
        ))}

      {phase === "after" && (
        <>
          <PsField id="callerNote" label="Note (Caller)" errors={errors.callerNote} hint="What are some things to keep in mind for the next stage?">
            {(p) => <PsTextarea name="callerNote" rows={3} maxLength={NOTE_MAX} defaultValue={values.callerNote} {...p} />}
          </PsField>
          {button("done", "Done")}
        </>
      )}

      {phase === "done" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-400">You marked this done.</p>
          {button("reopen", "Undo done", "secondary")}
        </div>
      )}
    </form>
  );
}
