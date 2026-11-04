import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import type { NotificationDoc, NotificationInput } from "./types";

export async function createNotification(createdBy: ObjectId, input: NotificationInput): Promise<void> {
  const now = new Date();
  const notifications = await getCollection<NotificationDoc>("notifications");
  await notifications.insertOne({ _id: new ObjectId(), ...input, publishedAt: input.published ? now : null, createdBy, createdAt: now, updatedAt: now });
}

/** False if it no longer exists. A draft published for the first time becomes new for members. */
export async function updateNotification(id: ObjectId, input: NotificationInput): Promise<boolean> {
  const now = new Date();
  const notifications = await getCollection<NotificationDoc>("notifications");
  const result = await notifications.updateOne({ _id: id }, [
    {
      $set: {
        ...input,
        updatedAt: now,
        // Keep the first publish time; a draft being published gets now.
        publishedAt: input.published ? { $ifNull: ["$publishedAt", now] } : "$publishedAt",
      },
    },
  ]);
  return result.matchedCount === 1;
}

export async function deleteNotification(id: ObjectId): Promise<boolean> {
  const notifications = await getCollection<NotificationDoc>("notifications");
  return (await notifications.deleteOne({ _id: id })).deletedCount === 1;
}
