import type { ObjectId } from "mongodb";
import type { ActivityKind } from "./constants";

/**
 * One thing a member did (`ps_activities`). `text` is written when it happens, from the member's
 * point of view ("Created the schedule “Interview”"), so it still reads right after the schedule,
 * group or person it names is gone.
 */
export type ActivityDoc = {
  _id: ObjectId;
  userId: ObjectId;
  kind: ActivityKind;
  text: string;
  createdAt: Date;
};

/** An activity for the browser. No user ids. */
export type Activity = {
  id: string;
  kind: ActivityKind;
  text: string;
  /** ISO time. */
  createdAt: string;
};
