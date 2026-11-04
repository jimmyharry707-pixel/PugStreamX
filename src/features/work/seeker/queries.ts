import "server-only";
import { readFile } from "node:fs/promises";
import { ObjectId } from "mongodb";
import { avatarUrl } from "@/features/account/profile/constants";
import { ROLES } from "@/features/account/users/roles";
import type { UserDoc } from "@/features/account/users/types";
import { getCollection } from "@/lib/db/client";
import { uploadPath } from "@/lib/storage/upload";
import { paginate, type Page } from "@/lib/utils/pagination";
import { WORK_RESULT_PAGE_SIZE } from "./constants";
import type { SeekerPerson, SeekerSummary, WorkFileDoc, WorkResult, WorkResultDoc, WorkTotals } from "./types";

// Work results are per-user data, so nothing here is cached.

const toWorkResult = (doc: WorkResultDoc, seeker?: SeekerPerson): WorkResult => ({
  id: doc._id.toHexString(),
  bidCount: doc.bidCount,
  files: doc.files.map((f) => ({ name: f.name, size: f.size })),
  createdAt: doc.createdAt.toISOString(),
  ...(seeker && { seeker }),
});

/** Bids and work results per job seeker (and their last upload). */
async function totalsBy(userIds: ObjectId[]): Promise<Map<string, WorkTotals & { lastAt: Date }>> {
  const results = await getCollection<WorkResultDoc>("workResults");
  const rows = await results
    .aggregate<{ _id: ObjectId; bids: number; results: number; lastAt: Date }>([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", bids: { $sum: "$bidCount" }, results: { $sum: 1 }, lastAt: { $max: "$createdAt" } } },
    ])
    .toArray();
  return new Map(rows.map((r) => [r._id.toHexString(), r]));
}

/** One page of a job seeker's work results, newest first, plus their totals. */
export async function listWorkResults(userId: ObjectId, requestedPage: number): Promise<{ items: WorkResult[]; page: Page; totals: WorkTotals }> {
  const sum = (await totalsBy([userId])).get(userId.toHexString());
  const totals = { bids: sum?.bids ?? 0, results: sum?.results ?? 0 };
  const page = paginate(requestedPage, totals.results, WORK_RESULT_PAGE_SIZE);
  const results = await getCollection<WorkResultDoc>("workResults");
  const docs = await results.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip(page.skip).limit(page.pageSize).toArray();
  return { items: docs.map((d) => toWorkResult(d)), page, totals };
}

/** The job seekers (role 4) now in a group, by id, as shown to their Profile Manager. */
async function groupSeekers(groupId: ObjectId): Promise<Map<string, { id: ObjectId; person: SeekerPerson }>> {
  const users = await getCollection<UserDoc>("users");
  const docs = await users
    .find({ groupId, role: ROLES.jobSeeker }, { projection: { email: 1, profile: 1 } })
    .sort({ "profile.fullName": 1, _id: 1 })
    .toArray();
  return new Map(
    docs.map((u) => [
      u._id.toHexString(),
      {
        id: u._id,
        person: {
          fullName: u.profile?.fullName ?? u.email,
          displayName: u.profile?.displayName ?? u.email,
          avatarUrl: u.profile ? avatarUrl(u.profile.avatarId.toHexString()) : null,
        },
      },
    ]),
  );
}

/**
 * A Profile Manager's view of their group: each job seeker now in it with their totals, the
 * group's totals, and one page of all their work results, newest first (with who uploaded each).
 * Callers must check that the viewer is a Profile Manager of this group.
 */
export async function listGroupWorkResults(
  groupId: ObjectId,
  requestedPage: number,
): Promise<{ seekers: SeekerSummary[]; totals: WorkTotals; items: WorkResult[]; page: Page }> {
  const members = await groupSeekers(groupId);
  const ids = [...members.values()].map((m) => m.id);
  const byUser = ids.length > 0 ? await totalsBy(ids) : new Map();
  const seekers = [...members.entries()].map(([key, m]) => {
    const t = byUser.get(key);
    return { ...m.person, bids: t?.bids ?? 0, results: t?.results ?? 0, lastAt: t?.lastAt.toISOString() ?? null };
  });
  const totals = { bids: seekers.reduce((n, s) => n + s.bids, 0), results: seekers.reduce((n, s) => n + s.results, 0) };
  const page = paginate(requestedPage, totals.results, WORK_RESULT_PAGE_SIZE);
  const results = await getCollection<WorkResultDoc>("workResults");
  const docs =
    ids.length > 0 ? await results.find({ userId: { $in: ids } }).sort({ createdAt: -1, _id: -1 }).skip(page.skip).limit(page.pageSize).toArray() : [];
  return { seekers, totals, items: docs.map((d) => toWorkResult(d, members.get(d.userId.toHexString())?.person)), page };
}

/** Who may open a work result: its job seeker, or a Profile Manager of the group they're now in. */
export type WorkResultViewer = { userId: ObjectId } | { groupId: ObjectId };

async function findViewable(id: ObjectId, viewer: WorkResultViewer): Promise<{ doc: WorkResultDoc; seeker?: SeekerPerson } | null> {
  const results = await getCollection<WorkResultDoc>("workResults");
  if ("userId" in viewer) {
    const doc = await results.findOne({ _id: id, userId: viewer.userId });
    return doc && { doc };
  }
  const doc = await results.findOne({ _id: id });
  if (!doc) return null;
  const member = (await groupSeekers(viewer.groupId)).get(doc.userId.toHexString());
  return member ? { doc, seeker: member.person } : null;
}

/** A work result the viewer may open, or null (another member's, or not in their group). */
export async function findWorkResult(id: ObjectId, viewer: WorkResultViewer): Promise<WorkResult | null> {
  const found = await findViewable(id, viewer);
  return found && toWorkResult(found.doc, found.seeker);
}

/** One file of a work result the viewer may open, with its bytes from disk, or null. */
export async function readWorkFile(id: ObjectId, index: number, viewer: WorkResultViewer): Promise<{ file: WorkFileDoc; bytes: Buffer } | null> {
  const found = await findViewable(id, viewer);
  const file = found?.doc.files[index];
  if (!found || !file) return null;
  try {
    const bytes = await readFile(uploadPath("work-results", found.doc.userId.toHexString(), found.doc._id.toHexString(), file.storedName));
    return { file, bytes };
  } catch {
    return null;
  }
}

/** Which of these file hashes the job seeker has already uploaded. */
export async function uploadedHashes(userId: ObjectId, hashes: string[]): Promise<Set<string>> {
  if (hashes.length === 0) return new Set();
  const results = await getCollection<WorkResultDoc>("workResults");
  const docs = await results.find({ userId, "files.sha256": { $in: hashes } }, { projection: { "files.sha256": 1 } }).toArray();
  const wanted = new Set(hashes);
  return new Set(docs.flatMap((d) => d.files.map((f) => f.sha256)).filter((h) => wanted.has(h)));
}
