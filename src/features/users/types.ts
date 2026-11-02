import type { ObjectId } from "mongodb";

/** Document in the `ps_users` collection. Never send this to the client: it holds the password hash. */
export type UserDoc = {
  _id: ObjectId;
  /** Trimmed and lowercased. Unique. */
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Safe user shape to pass to pages and client components. */
export type PublicUser = {
  id: string;
  email: string;
};
