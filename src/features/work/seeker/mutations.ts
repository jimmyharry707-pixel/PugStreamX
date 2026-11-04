import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import { uploadPath } from "@/lib/storage/upload";
import type { WorkResultDoc } from "./types";

/** Where a job seeker's files are saved: `upload/work-results/<userId>/`. */
const userDir = (userId: ObjectId) => uploadPath("work-results", userId.toHexString());

/**
 * Saves a work result: writes its files to `upload/work-results/<userId>/<resultId>/` under
 * generated names, then stores the document. The files must already be checked. If storing
 * fails, the files are removed again.
 */
export async function createWorkResult(userId: ObjectId, files: { name: string; bytes: Uint8Array; sha256: string }[]): Promise<WorkResultDoc> {
  const id = new ObjectId();
  const dir = path.join(userDir(userId), id.toHexString());
  await mkdir(dir, { recursive: true });
  try {
    const saved = await Promise.all(
      files.map(async (f) => {
        const storedName = `${randomUUID()}.html`;
        await writeFile(path.join(dir, storedName), f.bytes, { flag: "wx" });
        return { name: f.name, storedName, size: f.bytes.length, sha256: f.sha256 };
      }),
    );
    const doc: WorkResultDoc = { _id: id, userId, bidCount: saved.length, files: saved, createdAt: new Date() };
    const results = await getCollection<WorkResultDoc>("workResults");
    await results.insertOne(doc);
    return doc;
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

/** Deletes all of a member's work results and their files (when their account is deleted). */
export async function deleteWorkResultsOf(userId: ObjectId): Promise<void> {
  const results = await getCollection<WorkResultDoc>("workResults");
  await results.deleteMany({ userId });
  await rm(userDir(userId), { recursive: true, force: true });
}
