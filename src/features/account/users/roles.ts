// Shared by server and client code. Keep free of server-only imports.

/**
 * Roles are numbers starting at 0. Add new roles here with the next number, plus a label below.
 * Accounts start with no role (null) until one is given.
 */
export const ROLES = {
  /** Founder and super-admin: sees the Admin pages, activates accounts and assigns roles. */
  founder: 0,
  /** Makes and manages the schedules in their group's calendar. */
  profileManager: 1,
  /** Sees their group's calendar; adds the screen share link (when required) and a caller note. */
  caller: 2,
  /** Sees their group's schedules that need a tech supporter, read-only. */
  developer: 3,
  /** Applies for jobs and uploads their work results (saved job pages); each page is one bid. */
  jobSeeker: 4,
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const ROLE_LABELS: Record<Role, string> = {
  [ROLES.founder]: "Founder",
  [ROLES.profileManager]: "Profile Manager",
  [ROLES.caller]: "Caller",
  [ROLES.developer]: "Developer",
  [ROLES.jobSeeker]: "Job seeker",
};

export function roleLabel(role: number | null): string {
  if (role === null) return "No role";
  return ROLE_LABELS[role as Role] ?? `Role ${role}`;
}

export function isRole(value: number): value is Role {
  return (Object.values(ROLES) as number[]).includes(value);
}

/** Choices for the role picker: "No role" plus every role, in number order. */
export const ROLE_OPTIONS: { value: Role | null; label: string }[] = [
  { value: null, label: roleLabel(null) },
  ...(Object.values(ROLES) as Role[]).sort((a, b) => a - b).map((value) => ({ value, label: roleLabel(value) })),
];

/** Super-admins can see the Admin pages, activate or deactivate accounts and change roles. */
export function isSuperAdmin(role: number | null): boolean {
  return role === ROLES.founder;
}

/** Profile Managers create, edit, move and delete their group's schedules. */
export function isProfileManager(role: number | null): boolean {
  return role === ROLES.profileManager;
}

/** Callers see their group's schedules and fill in the caller fields. */
export function isCaller(role: number | null): boolean {
  return role === ROLES.caller;
}

/** Developers see their group's schedules that need a tech supporter, and change nothing. */
export function isDeveloper(role: number | null): boolean {
  return role === ROLES.developer;
}

/** Job seekers upload their work results on the Seeker page. */
export function isJobSeeker(role: number | null): boolean {
  return role === ROLES.jobSeeker;
}
