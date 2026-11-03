// Display helpers for schedules, in the calendar's time zone. Safe in the browser.

/** "10:00 – 11:30 AM" */
export function formatTimeRange(start: Date, end: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone, hour: "numeric", minute: "2-digit" }).formatRange(start, end);
}

/** "Tuesday, November 3, 2026" */
export function formatScheduleDate(start: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone, dateStyle: "full" }).format(start);
}

/** "Thu, Nov 5" */
export function formatShortDate(start: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone, weekday: "short", month: "short", day: "numeric" }).format(start);
}

/** "Thu, Nov 5, 3:40 PM" */
export function formatShortDateTime(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(at);
}

/** Minutes since midnight → "HH:MM" for a time input (kept within the day). */
export function minutesToTime(minutes: number): string {
  const m = Math.min(Math.max(Math.round(minutes), 0), 23 * 60 + 59);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Only http(s) links are ever rendered, even if bad data got into the database. */
export function safeUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
