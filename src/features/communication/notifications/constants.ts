// Shared by the client and the server. Keep free of server-only imports.

/** Founders write notifications here (listed in the Admin menu). */
export { ADMIN_NOTIFICATIONS_PATH } from "@/features/organization/admin/constants";

/** Cache tag of the published notifications (members' topbar bell). */
export const NOTIFICATIONS_TAG = "notifications";

export const TITLE_MAX = 120;
export const MESSAGE_MAX = 2000;

/** At most this many published notifications are shown to members (newest first). */
export const NOTIFICATIONS_SHOWN = 20;
/** Rows per page on Admin › Notifications. */
export const NOTIFICATION_PAGE_SIZE = 10;

/** "Don't show for a day": how long the popup stays away. */
export const SKIP_MS = 24 * 60 * 60 * 1000;

// Kept in this browser.
/** sessionStorage: set once the popup has opened by itself in this tab, so it opens only on arrival. */
export const SHOWN_KEY = "ps_notifications_shown";
/** localStorage: until when (ms) the popup doesn't open by itself. */
export const SKIP_UNTIL_KEY = "ps_notifications_skip_until";
/** localStorage: when (ms) the member last opened the notifications; newer ones put a dot on the bell. */
export const READ_AT_KEY = "ps_notifications_read_at";

export const NOTIFICATION_FIELDS = ["title", "message", "published"] as const;
export type NotificationField = (typeof NOTIFICATION_FIELDS)[number];
