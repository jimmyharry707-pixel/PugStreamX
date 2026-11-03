"use client";

import { useActionState, useEffect, useState } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsFormField } from "@/components/ui/ps-form-field";
import { PsInput } from "@/components/ui/ps-input";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { PsTimeZoneSelect } from "@/features/calendar/components/ps-time-zone-select";
import { saveSchedule } from "../actions";
import { NAME_MAX, NOTE_MAX, TITLE_MAX, URL_MAX, type ScheduleField } from "../constants";
import type { Schedule } from "../types";

export type ScheduleFormDefaults = Partial<Record<ScheduleField, string>>;

/**
 * Create or edit a schedule (edit when `scheduleId` is set). The date and times are read in
 * the chosen time zone, which starts as `defaults.timeZone` (the calendar's zone for a new
 * schedule). Changing the zone keeps the typed times: "10:00" then means 10:00 there.
 */
export function PsScheduleForm({
  scheduleId,
  defaults,
  onSaved,
  onCancel,
}: {
  scheduleId?: string;
  /** Must include `timeZone`. */
  defaults: ScheduleFormDefaults & { timeZone: string };
  onSaved: (schedule: Schedule) => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveSchedule, undefined);
  const values = state?.values ?? defaults;
  const errors = state?.errors ?? {};
  const [timeZone, setTimeZone] = useState(defaults.timeZone);

  useEffect(() => {
    if (state?.saved) onSaved(state.saved);
    // Only when a save finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} noValidate className="space-y-4">
      {scheduleId && <input type="hidden" name="scheduleId" value={scheduleId} />}
      {errors.form && <PsAlert>{errors.form[0]}</PsAlert>}

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
      <PsField id="screenShareUrl" label="Screen share link (optional)" errors={errors.screenShareUrl}>
        {(p) => (
          <PsInput
            name="screenShareUrl"
            type="url"
            inputMode="url"
            maxLength={URL_MAX}
            placeholder="https://"
            defaultValue={values.screenShareUrl}
            {...p}
          />
        )}
      </PsField>
      <PsField id="note" label="Note (optional)" errors={errors.note}>
        {(p) => <PsTextarea name="note" rows={3} maxLength={NOTE_MAX} defaultValue={values.note} {...p} />}
      </PsField>

      <div className="flex justify-end gap-2 pt-1">
        <PsButton type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </PsButton>
        <PsButton type="submit" size="sm" disabled={pending} className="min-w-24">
          {pending ? "Saving…" : "Save"}
        </PsButton>
      </div>
    </form>
  );
}
