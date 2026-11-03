"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireCompleteProfile } from "@/features/auth/dal";
import { formValues, type FormState } from "@/lib/utils/form";
import { calendarAccess } from "./access";
import type { CallerField, ScheduleField } from "./constants";
import { createSchedule, deleteSchedule, rescheduleSchedule, updateCallerFields, updateSchedule } from "./mutations";
import { findGroupUids, findScheduleDoc } from "./queries";
import type { Schedule } from "./types";
import { callerSchema, normalizeUid, rescheduleSchema, scheduleSchema } from "./validation";

// Profile Managers change their group's schedules; Callers only fill in the caller fields.
// Each action checks that itself (access.ts), so hidden buttons are never the only guard.

const NOT_MANAGER = "Only Profile Managers in this group can change schedules.";
const NOT_CALLER = "Only Callers in this group can fill this in.";

/** The signed-in user's group, if they're one of its Profile Managers (or Callers, with "call"). */
async function groupFor(mode: "manage" | "call") {
  const user = await requireCompleteProfile();
  const access = calendarAccess(user);
  return { user, groupId: access.mode === mode ? access.groupId : null };
}

export type ScheduleFormState =
  | (NonNullable<FormState<ScheduleField>> & {
      saved?: Schedule;
      /** The linked-schedule rows as submitted, to refill the list. */
      linkedValues?: string[];
      /** An error per linked-schedule row (same order), or null. */
      linkedErrors?: (string | null)[];
    })
  | undefined;

/** Creates a schedule, or updates one when the form has a `scheduleId`. Profile Managers only. */
export async function saveSchedule(_prev: ScheduleFormState, formData: FormData): Promise<ScheduleFormState> {
  const { user, groupId } = await groupFor("manage");

  // Linked schedules come as one `linkedUids` entry per row.
  const linkedValues = formData.getAll("linkedUids").filter((v): v is string => typeof v === "string");
  const failed = (errors: NonNullable<ScheduleFormState>["errors"], linkedErrors?: (string | null)[]): ScheduleFormState => ({
    errors,
    values: formValues(formData),
    linkedValues,
    linkedErrors,
  });
  if (!groupId) return failed({ form: [NOT_MANAGER] });

  const scheduleId = formData.get("scheduleId");
  const editing = typeof scheduleId === "string" && scheduleId !== "";
  const current = editing && ObjectId.isValid(scheduleId) ? await findScheduleDoc(groupId, new ObjectId(scheduleId)) : null;
  if (editing && !current) return failed({ form: ["This schedule no longer exists."] });

  const parsed = scheduleSchema.safeParse({ ...Object.fromEntries(formData), linkedUids: linkedValues });

  // An error per linked-schedule row, all at once: its format (from the schema), then whether
  // it's another schedule in the group.
  const formatErrors = linkedValues.map(
    (_, i) => parsed.error?.issues.find((issue) => issue.path[0] === "linkedUids" && issue.path[1] === i)?.message ?? null,
  );
  const wellFormed = linkedValues.map(normalizeUid).filter((uid, i) => uid && !formatErrors[i]);
  const inGroup = await findGroupUids(groupId, wellFormed);
  const rowErrors = linkedValues.map((value, i) => {
    const uid = normalizeUid(value);
    if (!uid || formatErrors[i]) return formatErrors[i];
    if (uid === current?.uid) return "A schedule can't be linked to itself.";
    return inGroup.has(uid) ? null : "No schedule in your group has this ID.";
  });

  if (!parsed.success || rowErrors.some(Boolean)) {
    // Errors about the whole list (e.g. too many) stay on the field; row errors go under rows.
    const fieldErrors: NonNullable<NonNullable<ScheduleFormState>["errors"]> = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;
    delete fieldErrors.linkedUids;
    const listErrors = parsed.error?.issues.filter((issue) => issue.path[0] === "linkedUids" && issue.path.length === 1).map((issue) => issue.message) ?? [];
    if (listErrors.length) fieldErrors.linkedUids = listErrors;
    return failed(fieldErrors, rowErrors);
  }

  if (current) {
    const saved = await updateSchedule(groupId, current._id, parsed.data);
    if (!saved) return failed({ form: ["This schedule no longer exists."] });
    return { saved };
  }
  return { saved: await createSchedule(groupId, new ObjectId(user.id), parsed.data) };
}

export type CallerFormState = (NonNullable<FormState<CallerField>> & { saved?: Schedule }) | undefined;

/** Saves a Caller's fields: the screen share link (while required) and the caller note. Callers only. */
export async function saveCallerFields(_prev: CallerFormState, formData: FormData): Promise<CallerFormState> {
  const { groupId } = await groupFor("call");
  if (!groupId) return { errors: { form: [NOT_CALLER] }, values: formValues(formData) };

  const parsed = callerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };
  const { scheduleId, ...input } = parsed.data;
  const saved = await updateCallerFields(groupId, new ObjectId(scheduleId), input);
  if (!saved) return { errors: { form: ["This schedule no longer exists."] }, values: formValues(formData) };
  return { saved };
}

/** Saves new times for a schedule moved or resized by dragging (ISO strings). Profile Managers only. */
export async function reschedule(
  scheduleId: string,
  start: string,
  end: string,
): Promise<{ ok: true; schedule: Schedule } | { ok: false; message: string }> {
  const { groupId } = await groupFor("manage");
  if (!groupId) return { ok: false, message: NOT_MANAGER };
  const parsed = rescheduleSchema.safeParse({ scheduleId, start, end });
  if (!parsed.success) return { ok: false, message: "That time isn't valid." };
  const schedule = await rescheduleSchedule(groupId, new ObjectId(parsed.data.scheduleId), parsed.data.start, parsed.data.end);
  return schedule ? { ok: true, schedule } : { ok: false, message: "This schedule no longer exists." };
}

/** Deletes a schedule. Profile Managers only. */
export async function removeSchedule(scheduleId: string): Promise<{ ok: boolean; message: string }> {
  const { groupId } = await groupFor("manage");
  if (!groupId) return { ok: false, message: NOT_MANAGER };
  const deleted = ObjectId.isValid(scheduleId) && (await deleteSchedule(groupId, new ObjectId(scheduleId)));
  return deleted ? { ok: true, message: "Schedule deleted." } : { ok: false, message: "This schedule no longer exists." };
}
