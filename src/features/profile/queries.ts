import "server-only";
import { ObjectId } from "mongodb";
import { findUserById } from "@/features/users/queries";
import { avatarUrl } from "./constants";

/** Current profile values to pre-fill the update form. */
export type ProfileFormInitial = {
  avatarUrl: string;
  fullName: string;
  displayName: string;
  birthday: string;
  address: string;
  /** E.164 */
  phone: string;
  /** Changes on every save; used as the form's React key. */
  version: string;
};

/** The given user's profile for editing, or null if they haven't completed one. */
export async function getProfileForEditing(userId: string): Promise<ProfileFormInitial | null> {
  const user = await findUserById(new ObjectId(userId));
  const p = user?.profile;
  if (!p) return null;
  return {
    avatarUrl: avatarUrl(p.avatarId.toHexString()),
    fullName: p.fullName,
    displayName: p.displayName,
    birthday: p.birthday,
    address: p.address,
    phone: p.phone.number,
    version: String(user.updatedAt.getTime()),
  };
}
