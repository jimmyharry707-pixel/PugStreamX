"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireCompleteProfile } from "@/features/auth/dal";
import { formValues, type FormState } from "@/lib/utils/form";
import type { ScheduleField } from "./constants";
import { createSchedule, deleteSchedule, updateSchedule } from "./mutations";
import type { Schedule } from "./types";
import { scheduleSchema } from "./validation";

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
  if (typeof scheduleId === "string" && scheduleId) {
    const saved = ObjectId.isValid(scheduleId) ? await updateSchedule(userId, new ObjectId(scheduleId), parsed.data) : null;
    if (!saved) return { errors: { form: ["This schedule no longer exists."] }, values: formValues(formData) };
    return { saved };
  }
  return { saved: await createSchedule(userId, parsed.data) };
}

export async function removeSchedule(scheduleId: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireCompleteProfile();
  const deleted = ObjectId.isValid(scheduleId) && (await deleteSchedule(new ObjectId(user.id), new ObjectId(scheduleId)));
  return deleted ? { ok: true, message: "Schedule deleted." } : { ok: false, message: "This schedule no longer exists." };
}
