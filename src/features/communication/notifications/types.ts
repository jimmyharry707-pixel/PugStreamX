import type { ObjectId } from "mongodb";

/** Document in `ps_notifications`: an announcement from the founders to every member. */
export type NotificationDoc = {
  _id: ObjectId;
  title: string;
  message: string;
  /** Only published notifications reach members. */
  published: boolean;
  /** When it was first published (it counts as new from then); null while a draft. */
  publishedAt: Date | null;
  /** The founder who wrote it. */
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationInput = Pick<NotificationDoc, "title" | "message" | "published">;

/** A notification for the browser. ISO timestamps; no user ids. */
export type Notification = {
  id: string;
  title: string;
  message: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
