// Shared by server and client code. Keep free of server-only imports.

/**
 * Roles are numbers starting at 0. Add new roles here with the next number, plus a label below.
 * Accounts start with no role (null) until one is given.
 */
export const ROLES = {
  /** Founder and super-admin: sees the Admin pages, activates accounts and assigns roles. */
  founder: 0,
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const ROLE_LABELS: Record<Role, string> = {
  [ROLES.founder]: "Founder",
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
