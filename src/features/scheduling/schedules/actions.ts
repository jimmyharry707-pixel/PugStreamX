"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { formValues, type FormState } from "@/lib/utils/form";
import { calendarAccess } from "./access";
import type { CallerField, ScheduleField } from "./constants";
import { createSchedule, deleteSchedule, rescheduleSchedule, updateCallerFields, updateSchedule } from "./mutations";
import { findGroupUids, findScheduleDoc } from "./queries";
import type { CallerIntent, Schedule } from "./types";
import { callerSchema, normalizeUid, rescheduleSchema, scheduleSchema } from "./validation";

// Profile Managers make schedules in their group and change only their own (a group can have
// several PMs; the others see them read-only); Callers only fill in the caller fields.
// Each action checks that itself (access.ts), so hidden buttons are never the only guard.

const NOT_MANAGER = "Only Profile Managers in this group can change schedules.";
const NOT_CALLER = "Only Callers in this group can fill this in.";
const NOT_OWNER = "Only the Profile Manager who made this schedule can change it.";
const GONE = "This schedule no longer exists.";
const PASSED = "This schedule has passed, so it can't be changed or deleted.";

/** Why a Profile Manager can't change a schedule: it's gone, another PM's, or has passed. Null if they can. */
async function ownerProblem(groupId: ObjectId, ownerId: ObjectId, scheduleId: string): Promise<string | null> {
  const doc = ObjectId.isValid(scheduleId) ? await findScheduleDoc(groupId, new ObjectId(scheduleId)) : null;
  if (!doc) return GONE;
  if (!doc.userId.equals(ownerId)) return NOT_OWNER;
  return hasPassed(doc.end) ? PASSED : null;
}

/** A schedule has passed once its end time is reached. */
const hasPassed = (end: Date) => end.getTime() <= Date.now();

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
  if (editing && !current) return failed({ form: [GONE] });
  if (current && !current.userId.equals(new ObjectId(user.id))) return failed({ form: [NOT_OWNER] });
  if (current && hasPassed(current.end)) return failed({ form: [PASSED] });

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
    const saved = await updateSchedule(groupId, current.userId, current._id, parsed.data);
    if (!saved) return failed({ form: [GONE] });
    return { saved };
  }
  return { saved: await createSchedule(groupId, new ObjectId(user.id), parsed.data) };
}

export type CallerFormState =
  | (NonNullable<FormState<CallerField>> & {
      saved?: Schedule;
      message?: string;
      /** The button that saved, so the form shows `message` only where it belongs. */
      intent?: CallerIntent;
    })
  | undefined;

/**
 * A Caller's part, which follows the interview's `start` (it may finish early):
 * - before it starts: Save the screen share link (only while required);
 * - once it has started: Done saves "Note (Caller)" (required) and marks the schedule done; Undo
 *   done ("reopen") takes that back.
 * Callers only.
 */
export async function saveCallerFields(_prev: CallerFormState, formData: FormData): Promise<CallerFormState> {
  const { groupId } = await groupFor("call");
  const failed = (errors: NonNullable<CallerFormState>["errors"]): CallerFormState => ({ errors, values: formValues(formData) });
  if (!groupId) return failed({ form: [NOT_CALLER] });

  const parsed = callerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(z.flattenError(parsed.error).fieldErrors);
  const { scheduleId, intent, screenShareUrl, callerNote } = parsed.data;
  const current = await findScheduleDoc(groupId, new ObjectId(scheduleId));
  if (!current) return failed({ form: ["This schedule no longer exists."] });
  // The interview may finish early, so the note and Done open when it starts.
  const started = current.start.getTime() <= Date.now();

  let changes: Parameters<typeof updateCallerFields>[2];
  if (intent === "reopen") {
    changes = { doneAt: null };
  } else if (intent === "done") {
    if (!started) return failed({ form: ["You can mark it done once the interview has started."] });
    if (!callerNote) return failed({ callerNote: ["Add your note before marking it done."] });
    // Already done (a repeated Done): keep when it was first marked.
    changes = { callerNote, doneAt: current.doneAt ?? new Date() };
  } else {
    if (started) return failed({ form: ["The interview has started: add your note and click Done."] });
    if (!(current.screenShareRequired ?? !!current.screenShareUrl)) return failed({ form: ["This schedule doesn't need a screen share link."] });
    changes = { screenShareUrl };
  }

  const saved = await updateCallerFields(groupId, current, changes);
  if (!saved) return failed({ form: ["This schedule no longer exists."] });
  return { saved, intent, message: intent === "done" ? "Marked as done." : intent === "reopen" ? "No longer done." : "Saved." };
}

/** Saves new times for a schedule moved or resized by dragging (ISO strings). Its own Profile Manager only. */
export async function reschedule(
  scheduleId: string,
  start: string,
  end: string,
): Promise<{ ok: true; schedule: Schedule } | { ok: false; message: string }> {
  const { user, groupId } = await groupFor("manage");
  if (!groupId) return { ok: false, message: NOT_MANAGER };
  const parsed = rescheduleSchema.safeParse({ scheduleId, start, end });
  if (!parsed.success) return { ok: false, message: "That time isn't valid." };
  const me = new ObjectId(user.id);
  const problem = await ownerProblem(groupId, me, parsed.data.scheduleId);
  if (problem) return { ok: false, message: problem };
  const schedule = await rescheduleSchedule(groupId, me, new ObjectId(parsed.data.scheduleId), parsed.data.start, parsed.data.end);
  return schedule ? { ok: true, schedule } : { ok: false, message: GONE };
}

/** Deletes a schedule. Its own Profile Manager only. */
export async function removeSchedule(scheduleId: string): Promise<{ ok: boolean; message: string }> {
  const { user, groupId } = await groupFor("manage");
  if (!groupId) return { ok: false, message: NOT_MANAGER };
  const me = new ObjectId(user.id);
  const problem = await ownerProblem(groupId, me, scheduleId);
  if (problem) return { ok: false, message: problem };
  const deleted = await deleteSchedule(groupId, me, new ObjectId(scheduleId));
  return deleted ? { ok: true, message: "Schedule deleted." } : { ok: false, message: GONE };
}
