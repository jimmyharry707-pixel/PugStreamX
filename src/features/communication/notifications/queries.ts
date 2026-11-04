import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getCollection } from "@/lib/db/client";
import { paginate, type Page } from "@/lib/utils/pagination";
import { NOTIFICATION_PAGE_SIZE, NOTIFICATIONS_SHOWN, NOTIFICATIONS_TAG } from "./constants";
import type { Notification, NotificationDoc } from "./types";

const toNotification = (doc: NotificationDoc): Notification => ({
  id: doc._id.toHexString(),
  title: doc.title,
  message: doc.message,
  published: doc.published,
  publishedAt: doc.publishedAt?.toISOString() ?? null,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

/**
 * The published notifications, newest first. The same for every member, so cached until a
 * founder changes one (`NOTIFICATIONS_TAG`), and at most for hours (in case the database is
 * changed directly). Callers must check that the member is signed in.
 */
export async function listPublishedNotifications(): Promise<Notification[]> {
  "use cache";
  cacheTag(NOTIFICATIONS_TAG);
  cacheLife("hours");
  const notifications = await getCollection<NotificationDoc>("notifications");
  const docs = await notifications.find({ published: true }).sort({ publishedAt: -1, _id: -1 }).limit(NOTIFICATIONS_SHOWN).toArray();
  return docs.map(toNotification);
}

/** One page of every notification (drafts too), newest first, for Admin › Notifications. Callers must check requireSuperAdmin(). */
export async function listNotificationsPage(requestedPage: number): Promise<{ items: Notification[]; page: Page }> {
  const notifications = await getCollection<NotificationDoc>("notifications");
  const page = paginate(requestedPage, await notifications.countDocuments({}), NOTIFICATION_PAGE_SIZE);
  const docs = await notifications.find({}).sort({ createdAt: -1, _id: -1 }).skip(page.skip).limit(page.pageSize).toArray();
  return { items: docs.map(toNotification), page };
}
