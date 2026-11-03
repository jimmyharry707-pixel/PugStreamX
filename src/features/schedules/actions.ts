"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireCompleteProfile } from "@/features/auth/dal";
import { formValues, type FormState } from "@/lib/utils/form";
import type { ScheduleField } from "./constants";
import { createSchedule, deleteSchedule, rescheduleSchedule, updateSchedule } from "./mutations";
import { findScheduleByUid, findScheduleDoc } from "./queries";
import type { Schedule } from "./types";
import { rescheduleSchema, scheduleSchema } from "./validation";

export type ScheduleFormState = (NonNullable<FormState<ScheduleField>> & { saved?: Schedule }) | undefined;

/** Creates a schedule, or updates one when the form has a `scheduleId`. */
export async function saveSchedule(_prev: ScheduleFormState, formData: FormData): Promise<ScheduleFormState> {
  const user = await requireCompleteProfile();

  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  }

  const userId = new ObjectId(user.id);
  const scheduleId = formData.get("scheduleId");
  const editing = typeof scheduleId === "string" && scheduleId !== "";
  const current = editing && ObjectId.isValid(scheduleId) ? await findScheduleDoc(userId, new ObjectId(scheduleId)) : null;
  if (editing && !current) return { errors: { form: ["This schedule no longer exists."] }, values: formValues(formData) };

  // The linked schedule must be another of the member's own schedules.
  const { linkedUid } = parsed.data;
  if (linkedUid) {
    const error =
      linkedUid === current?.uid
        ? "A schedule can't be linked to itself."
        : !(await findScheduleByUid(userId, linkedUid))
          ? "None of your schedules has this ID."
          : null;
    if (error) return { errors: { linkedUid: [error] }, values: formValues(formData) };
  }

  if (current) {
    const saved = await updateSchedule(userId, current._id, parsed.data);
    if (!saved) return { errors: { form: ["This schedule no longer exists."] }, values: formValues(formData) };
    return { saved };
  }
  return { saved: await createSchedule(userId, parsed.data) };
}

/** Saves new times for a schedule moved or resized by dragging in the calendar (ISO strings). */
export async function reschedule(
  scheduleId: string,
  start: string,
  end: string,
): Promise<{ ok: true; schedule: Schedule } | { ok: false; message: string }> {
  const user = await requireCompleteProfile();
  const parsed = rescheduleSchema.safeParse({ scheduleId, start, end });
  if (!parsed.success) return { ok: false, message: "That time isn't valid." };
  const schedule = await rescheduleSchedule(new ObjectId(user.id), new ObjectId(parsed.data.scheduleId), parsed.data.start, parsed.data.end);
  return schedule ? { ok: true, schedule } : { ok: false, message: "This schedule no longer exists." };
}

export async function removeSchedule(scheduleId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireCompleteProfile();
  const deleted = ObjectId.isValid(scheduleId) && (await deleteSchedule(new ObjectId(user.id), new ObjectId(scheduleId)));
  return deleted ? { ok: true, message: "Schedule deleted." } : { ok: false, message: "This schedule no longer exists." };
}
