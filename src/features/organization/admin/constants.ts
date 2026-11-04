// Shared by the client and the server. Keep free of server-only imports.

/** Root of the super-admin pages. Redirects to the first page below. */
export const ADMIN_PATH = "/admin";
/** Every account, with activation and role controls. */
export const ADMIN_USERS_PATH = "/admin/users";
/** Groups: members of a group share one calendar. */
export const ADMIN_GROUPS_PATH = "/admin/groups";

/** Members' payment requests (features/finance/invoices). */
export const ADMIN_INVOICES_PATH = "/admin/invoices";

/** Announcements shown to every member (features/communication/notifications). */
export const ADMIN_NOTIFICATIONS_PATH = "/admin/notifications";

/** Pages listed in the left panel's Admin dropdown. Add new admin pages here. */
export const ADMIN_NAV_ITEMS = [
  { label: "Users", href: ADMIN_USERS_PATH },
  { label: "Groups", href: ADMIN_GROUPS_PATH },
  { label: "Invoices", href: ADMIN_INVOICES_PATH },
  { label: "Notifications", href: ADMIN_NOTIFICATIONS_PATH },
] as const;

/** `?status=` filters on the Users page. */
export const USER_STATUS_FILTERS = ["all", "inactive", "active"] as const;
export type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number];

/** `?user=<id>` on the Users page opens that user's full profile. */
export const USER_PARAM = "user";
