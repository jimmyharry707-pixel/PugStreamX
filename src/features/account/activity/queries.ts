import "server-only";
import type { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { paginate, type Page } from "@/lib/utils/pagination";
import { ACTIVITY_PAGE_SIZE } from "./constants";
import type { Activity, ActivityDoc } from "./types";

const toActivity = (doc: ActivityDoc): Activity => ({ id: doc._id.toHexString(), kind: doc.kind, text: doc.text, createdAt: doc.createdAt.toISOString() });

/**
 * One page of a member's activity, newest first. Pages only show their own (the dashboard), or
 * anyone's to a super-admin (Admin › Users).
 */
export async function listActivitiesPage(userId: ObjectId, requestedPage: number): Promise<{ items: Activity[]; page: Page }> {
  const activities = await getCollection<ActivityDoc>("activities");
  const page = paginate(requestedPage, await activities.countDocuments({ userId }), ACTIVITY_PAGE_SIZE);
  const docs = await activities.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip(page.skip).limit(page.pageSize).toArray();
  return { items: docs.map(toActivity), page };
}
