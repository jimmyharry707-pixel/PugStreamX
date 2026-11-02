import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import type { UserDoc } from "./types";

export type CreateUserInput = Pick<UserDoc, "email" | "passwordHash">;

export type CreateUserResult = { ok: true; user: UserDoc } | { ok: false; reason: "email_taken" };

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const now = new Date();
  const user: UserDoc = { _id: new ObjectId(), ...input, createdAt: now, updatedAt: now };

  const users = await getCollection<UserDoc>("users");
  try {
    await users.insertOne(user);
  } catch (err) {
    // The unique index on `email` rejects duplicates, even when two sign-ups race.
    if (err instanceof MongoServerError && err.code === 11000) return { ok: false, reason: "email_taken" };
    throw err;
  }
  return { ok: true, user };
}
