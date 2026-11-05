"use server";

import { ObjectId } from "mongodb";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { quoted } from "@/features/account/activity/constants";
import { recordActivity } from "@/features/account/activity/mutations";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { formValues, type FormState } from "@/lib/utils/form";
import { NOTIFICATIONS_TAG, type NotificationField } from "./constants";
import { createNotification, deleteNotification, updateNotification } from "./mutations";
import { deleteNotificationSchema, saveNotificationSchema } from "./validation";

export type NotificationFormState = (NonNullable<FormState<NotificationField>> & { saved?: true }) | undefined;

/** Creates a notification, or edits one when the form has a `notificationId`. Super-admins only. */
export async function saveNotification(_prev: NotificationFormState, formData: FormData): Promise<NotificationFormState> {
  const admin = await requireSuperAdmin();
  const parsed = saveNotificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };

  const { notificationId, ...input } = parsed.data;
  if (notificationId) {
    if (!(await updateNotification(new ObjectId(notificationId), input))) {
      return { errors: { form: ["This notification no longer exists."] }, values: formValues(formData) };
    }
    await recordActivity(admin.id, "admin", `Edited the notification ${quoted(input.title)}${input.published ? "" : " (draft)"}`);
  } else {
    await createNotification(new ObjectId(admin.id), input);
    await recordActivity(admin.id, "admin", `${input.published ? "Published" : "Saved a draft of"} the notification ${quoted(input.title)}`);
  }
  // Members' bells read the cached list.
  updateTag(NOTIFICATIONS_TAG);
  refresh();
  return { saved: true };
}

/** Deletes a notification. Super-admins only. */
export async function removeNotification(notificationId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireSuperAdmin();
  const parsed = deleteNotificationSchema.safeParse({ notificationId });
  const title = parsed.success ? await deleteNotification(new ObjectId(parsed.data.notificationId)) : null;
  if (title === null) return { ok: false, message: "This notification no longer exists." };
  await recordActivity(admin.id, "admin", `Deleted the notification ${quoted(title)}`);
  updateTag(NOTIFICATIONS_TAG);
  refresh();
  return { ok: true, message: "Notification deleted." };
}
