import type { ObjectId } from "mongodb";

/** One uploaded file, saved as `upload/work-results/<userId>/<resultId>/<storedName>`. */
export type WorkFileDoc = {
  /** The file's name on the member's computer (shown only; never used as a path). */
  name: string;
  /** The name it's saved under: generated on the server. */
  storedName: string;
  size: number;
  /** SHA-256 of its bytes (hex), so the same page can't be uploaded twice. */
  sha256: string;
};

/** One work result in `ps_work_results`: the files a job seeker uploaded together. */
export type WorkResultDoc = {
  _id: ObjectId;
  userId: ObjectId;
  /** The number of files, stored for totals. */
  bidCount: number;
  files: WorkFileDoc[];
  createdAt: Date;
};

/** A job seeker as shown to their Profile Manager or a founder (no ids). `groupName` only on the founder's view (null: no group). */
export type SeekerPerson = { fullName: string; displayName: string; avatarUrl: string | null; groupName?: string | null };

/** A work result as sent to the browser (no user ids or paths on disk). */
export type WorkResult = {
  id: string;
  bidCount: number;
  files: { name: string; size: number }[];
  createdAt: string;
  /** Who uploaded it: only on the Profile Manager's and founder's views. */
  seeker?: SeekerPerson;
};

export type WorkTotals = { bids: number; results: number };

/** One job seeker (on the Profile Manager's or founder's view), with their totals. */
export type SeekerSummary = SeekerPerson & WorkTotals & { lastAt: string | null };

/** What the upload API answers. */
export type UploadResponse = { ok: true; bidCount: number } | { ok: false; errors: string[] };

/** What `GET /api/work-results/counts` answers: periods newest first ("YYYY-MM-DD" days in the viewer's zone). */
export type BidCountsResponse = {
  periods: { start: string; end: string; bids: number; results: number }[];
  /** Whether there are bids before the oldest period shown. */
  hasEarlier: boolean;
};
