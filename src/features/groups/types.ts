import type { ObjectId } from "mongodb";

/** A group in `ps_groups`. Its members (`UserDoc.groupId`) share one calendar. */
export type GroupDoc = {
  _id: ObjectId;
  name: string;
  /** Lowercased name. Unique, so names are unique ignoring case. */
  nameKey: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A group as sent to pages and the browser. */
export type Group = { id: string; name: string };

/** A group with counts, for the Admin > Groups page. */
export type GroupListItem = Group & { memberCount: number; scheduleCount: number; createdAt: string };
