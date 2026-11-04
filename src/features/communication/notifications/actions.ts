"use server";

import { ObjectId } from "mongodb";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
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
  } else {
    await createNotification(new ObjectId(admin.id), input);
  }
  // Members' bells read the cached list.
  updateTag(NOTIFICATIONS_TAG);
  refresh();
  return { saved: true };
}

/** Deletes a notification. Super-admins only. */
export async function removeNotification(notificationId: string): Promise<{ ok: boolean; message: string }> {
  await requireSuperAdmin();
  const parsed = deleteNotificationSchema.safeParse({ notificationId });
  if (!parsed.success || !(await deleteNotification(new ObjectId(parsed.data.notificationId)))) {
    return { ok: false, message: "This notification no longer exists." };
  }
  updateTag(NOTIFICATIONS_TAG);
  refresh();
  return { ok: true, message: "Notification deleted." };
}
