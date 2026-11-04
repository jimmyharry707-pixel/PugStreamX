import "server-only";
import { readFile } from "node:fs/promises";
import { ObjectId } from "mongodb";
import { avatarUrl } from "@/features/account/profile/constants";
import { ROLES } from "@/features/account/users/roles";
import type { UserDoc } from "@/features/account/users/types";
import { getCollection } from "@/lib/db/client";
import { uploadPath } from "@/lib/storage/upload";
import { paginate, type Page } from "@/lib/utils/pagination";
import { zonedTime, zonedToUtc } from "@/lib/utils/time-zone";
import { toDateKey } from "@/features/scheduling/calendar/dates";
import type { PeriodRange } from "./periods";
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

/**
 * Which job seekers a view covers: `groupId` an ObjectId for one group, null for those without
 * a group, or left out for every group (founders).
 */
export type SeekerScope = { groupId?: ObjectId | null };

type Member = { id: ObjectId; person: SeekerPerson };

/** The job seekers (role 4) now in the scope, by id, by name. `groupNames` adds their group's name. */
async function seekersIn(scope: SeekerScope, groupNames?: Map<string, string>): Promise<Map<string, Member>> {
  const users = await getCollection<UserDoc>("users");
  const docs = await users
    .find({ role: ROLES.jobSeeker, ...("groupId" in scope && { groupId: scope.groupId }) }, { projection: { email: 1, profile: 1, groupId: 1 } })
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
          ...(groupNames && { groupName: (u.groupId && groupNames.get(u.groupId.toHexString())) ?? null }),
        },
      },
    ]),
  );
}

/**
 * The Profile Manager's and founder's view: every job seeker now in the scope with their totals,
 * and one page of work results, newest first, with who uploaded each. `seeker` (a display name,
 * ignoring case) narrows the totals and the list to one of them; `selected` is null when it
 * isn't in the scope. Callers must check who may see the scope.
 */
export async function listSeekerWorkResults(
  scope: SeekerScope,
  seeker: string | null,
  requestedPage: number,
  groupNames?: Map<string, string>,
): Promise<{ seekers: SeekerSummary[]; selected: SeekerSummary | null; totals: WorkTotals; items: WorkResult[]; page: Page }> {
  const members = await seekersIn(scope, groupNames);
  const byUser = members.size > 0 ? await totalsBy([...members.values()].map((m) => m.id)) : new Map();
  const seekers = [...members.entries()].map(([key, m]) => {
    const t = byUser.get(key);
    return { ...m.person, bids: t?.bids ?? 0, results: t?.results ?? 0, lastAt: t?.lastAt.toISOString() ?? null };
  });
  const wanted = seeker?.toLowerCase();
  const selectedKey = wanted ? [...members.entries()].find(([, m]) => m.person.displayName.toLowerCase() === wanted)?.[0] : undefined;
  const selected = selectedKey ? seekers[[...members.keys()].indexOf(selectedKey)] : null;
  const shown = selected ? [selected] : seekers;
  const ids = selectedKey ? [members.get(selectedKey)!.id] : [...members.values()].map((m) => m.id);

  const totals = { bids: shown.reduce((n, s) => n + s.bids, 0), results: shown.reduce((n, s) => n + s.results, 0) };
  const page = paginate(requestedPage, totals.results, WORK_RESULT_PAGE_SIZE);
  const results = await getCollection<WorkResultDoc>("workResults");
  const docs =
    ids.length > 0 ? await results.find({ userId: { $in: ids } }).sort({ createdAt: -1, _id: -1 }).skip(page.skip).limit(page.pageSize).toArray() : [];
  return { seekers, selected, totals, items: docs.map((d) => toWorkResult(d, members.get(d.userId.toHexString())?.person)), page };
}

/**
 * Who may open a work result: its job seeker (`userId`), a Profile Manager for the job seekers
 * now in their group (`groupId`), or a founder for anyone's (`all`).
 */
export type WorkResultViewer = { userId: ObjectId } | { groupId: ObjectId } | { all: true };

async function findViewable(id: ObjectId, viewer: WorkResultViewer): Promise<{ doc: WorkResultDoc; seeker?: SeekerPerson } | null> {
  const results = await getCollection<WorkResultDoc>("workResults");
  if ("userId" in viewer) {
    const doc = await results.findOne({ _id: id, userId: viewer.userId });
    return doc && { doc };
  }
  const doc = await results.findOne({ _id: id });
  if (!doc) return null;
  const users = await getCollection<UserDoc>("users");
  const owner = await users.findOne({ _id: doc.userId, ...("groupId" in viewer && { role: ROLES.jobSeeker, groupId: viewer.groupId }) }, { projection: { email: 1, profile: 1 } });
  if (!owner) return null;
  const seeker = {
    fullName: owner.profile?.fullName ?? owner.email,
    displayName: owner.profile?.displayName ?? owner.email,
    avatarUrl: owner.profile ? avatarUrl(owner.profile.avatarId.toHexString()) : null,
  };
  return { doc, seeker };
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

/** The ids of the job seekers in the scope, or only `seeker`'s (a display name) when given and in it. */
export async function seekerIdsIn(scope: SeekerScope, seeker: string | null): Promise<ObjectId[]> {
  const members = [...(await seekersIn(scope)).values()];
  const wanted = seeker?.toLowerCase();
  const one = wanted ? members.find((m) => m.person.displayName.toLowerCase() === wanted) : undefined;
  return one ? [one.id] : members.map((m) => m.id);
}

/**
 * Bids and work results in each period (days in `timeZone`, see periods.ts) for these job
 * seekers, plus whether any came before the first period.
 */
export async function countBidsByPeriod(
  userIds: ObjectId[],
  ranges: PeriodRange[],
  timeZone: string,
): Promise<{ counts: (WorkTotals & PeriodRange)[]; hasEarlier: boolean }> {
  const counts = ranges.map((r) => ({ ...r, bids: 0, results: 0 }));
  if (userIds.length === 0 || ranges.length === 0) return { counts, hasEarlier: false };
  const from = zonedToUtc(ranges[0].start, "00:00", timeZone);
  const to = zonedToUtc(ranges[ranges.length - 1].end, "00:00", timeZone);
  const results = await getCollection<WorkResultDoc>("workResults");
  const [docs, earlier] = await Promise.all([
    results.find({ userId: { $in: userIds }, createdAt: { $gte: from, $lt: to } }, { projection: { createdAt: 1, bidCount: 1 } }).toArray(),
    results.findOne({ userId: { $in: userIds }, createdAt: { $lt: from } }, { projection: { _id: 1 } }),
  ]);
  for (const doc of docs) {
    const key = toDateKey(zonedTime(doc.createdAt, timeZone).day);
    const bucket = counts.find((c) => c.start <= key && key < c.end);
    if (bucket) {
      bucket.bids += doc.bidCount;
      bucket.results += 1;
    }
  }
  return { counts, hasEarlier: !!earlier };
}
