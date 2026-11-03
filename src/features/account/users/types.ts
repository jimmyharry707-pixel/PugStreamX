import type { ObjectId } from "mongodb";

/** Required profile, filled in on first sign-in at /complete-profile. */
export type UserProfile = {
  /** File id in the `ps_avatars` GridFS bucket. */
  avatarId: ObjectId;
  fullName: string;
  /** As typed, e.g. "Jane.Doe". */
  displayName: string;
  /** Lowercased displayName. Unique, so display names are unique ignoring case. */
  displayNameKey: string;
  /** Calendar date "YYYY-MM-DD". Stored as text so time zones can't shift it. */
  birthday: string;
  address: string;
  phone: {
    /** E.164, e.g. "+821012345678". */
    number: string;
    /** ISO 3166-1 alpha-2 country code, e.g. "KR". */
    country: string;
  };
  completedAt: Date;
};

/** Document in the `ps_users` collection. Never send this to the client: it holds the password hash. */
export type UserDoc = {
  _id: ObjectId;
  /** Trimmed and lowercased. Unique. */
  email: string;
  passwordHash: string;
  /** Number from ROLES (features/account/users/roles.ts); 0 is the founder. Null until a role is given. */
  role: number | null;
  /** New accounts start inactive and can't sign in until a super-admin activates them. */
  active: boolean;
  /** The user's group (`ps_groups`), set by a super-admin. Its members share a calendar. */
  groupId?: ObjectId | null;
  /** Missing until the user completes their profile. */
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
};

/** The parts of a profile that are safe to show around the app (e.g. the topbar badge). */
export type PublicProfile = {
  fullName: string;
  displayName: string;
  /** URL of the avatar image (served only to signed-in members). */
  avatarUrl: string;
};

/** Safe user shape to pass to pages and client components. */
export type PublicUser = {
  id: string;
  email: string;
  /** False until /complete-profile has been submitted. The main site is blocked until then. */
  profileComplete: boolean;
  /** Null until the profile is complete. */
  profile: PublicProfile | null;
  role: number | null;
  /** Role 0 (founder): may open the Admin page and activate accounts. */
  isSuperAdmin: boolean;
  /** The user's group id, or null. */
  groupId: string | null;
};

/** One row of the Admin page's account list. */
export type UserListItem = PublicUser & {
  active: boolean;
  /** ISO timestamp. */
  createdAt: string;
};

/** A full account, for super-admins only (Admin > Users > a user). */
export type UserDetails = UserListItem & {
  /** Null until the profile is complete. */
  details: {
    birthday: string;
    address: string;
    phone: UserProfile["phone"];
    /** ISO timestamp. */
    completedAt: string;
  } | null;
};
