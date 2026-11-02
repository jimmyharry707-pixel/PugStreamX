import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import type { PublicUser, UserDoc } from "./types";

// User reads are per-request and never cached: they back authentication.

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const users = await getCollection<UserDoc>("users");
  return users.findOne({ email });
}

export async function findUserById(id: ObjectId): Promise<UserDoc | null> {
  const users = await getCollection<UserDoc>("users");
  return users.findOne({ _id: id });
}

export function toPublicUser(user: UserDoc): PublicUser {
  return { id: user._id.toHexString(), email: user.email };
}
