// Display helpers for chat, in the viewer's device time zone. Safe in the browser.

import { UNREAD_MAX } from "./constants";

const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });
const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "3:40 PM" */
export const formatMessageTime = (iso: string) => time.format(new Date(iso));

/** For the conversation list: the time today, "Yesterday", or "Nov 2". */
export function formatListTime(iso: string, now = new Date()): string {
  const at = new Date(iso);
  if (sameDay(at, now)) return time.format(at);
  if (sameDay(at, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "Yesterday";
  return shortDate.format(at);
}

/** A day separator in a thread: "Today", "Yesterday", or "Monday, November 2, 2026". */
export function formatDayLabel(iso: string, now = new Date()): string {
  const at = new Date(iso);
  if (sameDay(at, now)) return "Today";
  if (sameDay(at, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return "Yesterday";
  return longDate.format(at);
}

export const isSameLocalDay = (a: string, b: string) => sameDay(new Date(a), new Date(b));

/** "3", or "99+". */
export const formatUnread = (n: number) => (n > UNREAD_MAX ? `${UNREAD_MAX}+` : String(n));

/**
 * Splits text into plain parts and http(s) links, so links can be rendered clickable (never as
 * HTML). Trailing punctuation ("see https://x.com.") stays out of the link.
 */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = [];
  let last = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s<>"]+/gi)) {
    const url = match[0].replace(/[.,!?;:)\]'"]+$/, "");
    const start = match.index;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: url, href: url });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
