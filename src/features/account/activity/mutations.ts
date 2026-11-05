import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { ACTIVITY_TEXT_MAX, type ActivityKind } from "./constants";
import type { ActivityDoc } from "./types";

/**
 * Adds to a member's recent activity. Call it from every action once the change has been made
 * (before any `redirect()`, which throws). It never fails the action: if it can't be saved, it's
 * only logged.
 */
export async function recordActivity(userId: ObjectId | string, kind: ActivityKind, text: string): Promise<void> {
  try {
    const activities = await getCollection<ActivityDoc>("activities");
    await activities.insertOne({
      _id: new ObjectId(),
      userId: typeof userId === "string" ? new ObjectId(userId) : userId,
      kind,
      text: text.length > ACTIVITY_TEXT_MAX ? `${text.slice(0, ACTIVITY_TEXT_MAX - 1)}…` : text,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Couldn't record an activity:", err);
  }
}

/** When an account is deleted, its activity goes with it. */
export async function deleteActivitiesOf(userId: ObjectId): Promise<void> {
  const activities = await getCollection<ActivityDoc>("activities");
  await activities.deleteMany({ userId });
}
