"use client";

import { useActionState, useEffect, useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsFormField } from "@/components/ui/ps-form-field";
import { PsSwitch } from "@/components/ui/ps-switch";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { PsTimeZoneSelect } from "@/features/scheduling/calendar/components/ps-time-zone-select";
import { saveSchedule } from "../actions";
import { PsLinkedSchedulesField } from "./ps-linked-schedules-field";
import { NAME_MAX, NOTE_MAX, TITLE_MAX, URL_MAX, type ScheduleField } from "../constants";
import type { Schedule } from "../types";
import { useReached } from "../use-started";

export type ScheduleFormDefaults = Partial<Record<Exclude<ScheduleField, "linkedUids">, string>> & { linkedUids?: string[] };

const NO_LINKS: string[] = [];
/** A time that's never reached (for a new schedule, which has no end to pass yet). */
const NEVER = "9999-12-31T23:59:59.999Z";

/**
 * Create or edit a schedule (edit when `scheduleId` is set). The date and times are read in
 * the chosen time zone, which starts as `defaults.timeZone` (the calendar's zone for a new
 * schedule). Changing the zone keeps the typed times: "10:00" then means 10:00 there.
 */
export function PsScheduleForm({
  scheduleId,
  passesAt,
  defaults,
  onSaved,
  onCancel,
}: {
  scheduleId?: string;
  /** When editing: the schedule's current end (ISO). Once reached it's locked, so Save turns off. */
  passesAt?: string;
  /** Must include `timeZone`. */
  defaults: ScheduleFormDefaults & { timeZone: string };
  onSaved: (schedule: Schedule) => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveSchedule, undefined);
  const values = state?.values ?? defaults;
  const errors = state?.errors ?? {};
  const linkedValues = state?.linkedValues ?? defaults.linkedUids ?? NO_LINKS;
  const [timeZone, setTimeZone] = useState(defaults.timeZone);
  // A new schedule never "passes" while being written (its end is checked on Save instead).
  const passed = useReached(passesAt ?? NEVER);

  useEffect(() => {
    if (state?.saved) onSaved(state.saved);
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      {scheduleId && <input type="hidden" name="scheduleId" value={scheduleId} />}
      {passed ? (
        <PsAlert>This schedule has passed while you were editing, so it can&apos;t be changed anymore.</PsAlert>
      ) : (
        errors.form && <PsAlert>{errors.form[0]}</PsAlert>
      )}

      <PsFormField label="Title" name="title" required maxLength={TITLE_MAX} defaultValue={values.title} errors={errors.title} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="col-span-2 sm:col-span-1">
          <PsFormField label="Date" name="date" type="date" required defaultValue={values.date} errors={errors.date} />
        </div>
        <PsFormField label="From" name="from" type="time" step={300} required defaultValue={values.from} errors={errors.from} />
        <PsFormField label="To" name="to" type="time" step={300} required defaultValue={values.to} errors={errors.to} />
      </div>
      <PsField id="timeZone" label="Time zone" errors={errors.timeZone}>
        {(p) => <PsTimeZoneSelect variant="field" name="timeZone" value={timeZone} onChange={setTimeZone} {...p} />}
      </PsField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PsFormField
          label="Client company"
          name="clientCompany"
          required
          maxLength={NAME_MAX}
          defaultValue={values.clientCompany}
          errors={errors.clientCompany}
        />
        <PsFormField
          label="Interviewer"
          name="interviewer"
          required
          maxLength={NAME_MAX}
          defaultValue={values.interviewer}
          errors={errors.interviewer}
        />
      </div>

      <PsFormField
        label="Meeting link"
        name="meetingUrl"
        type="url"
        inputMode="url"
        required
        maxLength={URL_MAX}
        placeholder="https://"
        defaultValue={values.meetingUrl}
        errors={errors.meetingUrl}
      />
      <PsFormField
        label="Resume link"
        name="resumeUrl"
        type="url"
        inputMode="url"
        required
        maxLength={URL_MAX}
        placeholder="https://"
        defaultValue={values.resumeUrl}
        errors={errors.resumeUrl}
      />
      <PsFormField
        label="Job description link"
        name="jobDescriptionUrl"
        type="url"
        inputMode="url"
        required
        maxLength={URL_MAX}
        placeholder="https://"
        defaultValue={values.jobDescriptionUrl}
        errors={errors.jobDescriptionUrl}
      />
      <PsSwitch
        id="screenShareRequired"
        name="screenShareRequired"
        label="Screen share required"
        hint="When on, the Caller adds the screen share link. Turning it off removes their link."
        defaultChecked={values.screenShareRequired === "on"}
        className="rounded-lg border border-white/10 bg-gray-800/40 px-3 py-2.5"
      />
      <PsSwitch
        id="techSupportRequired"
        name="techSupportRequired"
        label="Tech supporter needed"
        hint="When on, the group's Developers see this schedule (read-only)."
        defaultChecked={values.techSupportRequired === "on"}
        className="rounded-lg border border-white/10 bg-gray-800/40 px-3 py-2.5"
      />
      <PsLinkedSchedulesField values={linkedValues} rowErrors={state?.linkedErrors} errors={errors.linkedUids} />
      <PsField id="note" label="Note (optional)" errors={errors.note}>
        {(p) => <PsTextarea name="note" rows={3} maxLength={NOTE_MAX} defaultValue={values.note} {...p} />}
      </PsField>

      <div className="flex justify-end gap-2 pt-1">
        <PsButton type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </PsButton>
        <PsButton type="submit" size="sm" disabled={pending || passed} className="min-w-24">
          {pending ? "Saving…" : "Save"}
        </PsButton>
      </div>
    </form>
  );
}
