// Shared by the client and the server. Keep free of server-only imports.

/** What an activity is about: its badge on the list. */
export const ACTIVITY_KINDS = ["account", "schedule", "chat", "invoice", "work", "admin"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  account: "Account",
  schedule: "Schedule",
  chat: "Chat",
  invoice: "Invoice",
  work: "Seeker",
  admin: "Admin",
};

/** Rows per page, on the dashboard and in Admin › Users › Show activity. */
export const ACTIVITY_PAGE_SIZE = 10;

/** The longest activity text kept (titles and names inside it are cut to fit). */
export const ACTIVITY_TEXT_MAX = 300;

/** `?activity=<userId>` on Admin › Users opens that member's activity. */
export const ACTIVITY_PARAM = "activity";
/** That dialog's own page (`?activityPage=N`), so the user list keeps its `?page`. */
export const ACTIVITY_PAGE_PARAM = "activityPage";

/** A name or title quoted inside an activity text, cut if it's long. */
export function quoted(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return `“${clean.length > max ? `${clean.slice(0, max - 1)}…` : clean}”`;
}
