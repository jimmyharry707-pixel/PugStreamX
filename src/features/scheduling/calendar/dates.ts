import { WEEK_STARTS_ON } from "./constants";

// Pure date helpers for the calendar. Everything works on local calendar days (midnight, the
// user's time zone) and uses "YYYY-MM-DD" keys in URLs, so time zones can't shift a day.

const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses a "YYYY-MM-DD" key; null if it's missing or not a real date (e.g. 2026-02-31). */
export function parseDateKey(key: string | null | undefined): Date | null {
  const match = key ? KEY_PATTERN.exec(key) : null;
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toDateKey(date) === key ? date : null;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Adds months, keeping the day where possible (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + months + 1, 0).getDate();
  return new Date(date.getFullYear(), date.getMonth() + months, Math.min(date.getDate(), lastDay));
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() - WEEK_STARTS_ON + 7) % 7));
}

export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && toDateKey(a) === toDateKey(b);
}

export function isSameWeek(a: Date, b: Date): boolean {
  return isSameDay(startOfWeek(a), startOfWeek(b));
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Saturday or Sunday. */
export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

/** Six weeks starting with the week holding the 1st, for a small month calendar. */
export function monthWeeks(date: Date): Date[][] {
  const start = startOfWeek(startOfMonth(date));
  return Array.from({ length: 6 }, (_, i) => weekDays(addDays(start, i * 7)));
}

const monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const shortMonth = new Intl.DateTimeFormat("en", { month: "short" });
const shortMonthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

/**
 * Title of the week holding `date`: "November 2026" ("Nov 2026" when `short`, for phones),
 * "Nov – Dec 2026" or "Dec 2026 – Jan 2027".
 */
export function weekTitle(date: Date, { short = false } = {}): string {
  const days = weekDays(date);
  const [first, last] = [days[0], days[6]];
  if (isSameMonth(first, last)) return (short ? shortMonthYear : monthYear).format(first);
  if (first.getFullYear() === last.getFullYear()) {
    return `${shortMonth.format(first)} – ${shortMonthYear.format(last)}`;
  }
  return `${shortMonthYear.format(first)} – ${shortMonthYear.format(last)}`;
}

export const formatMonthYear = monthYear.format;
export const formatWeekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format;
export const formatWeekdayNarrow = new Intl.DateTimeFormat("en", { weekday: "narrow" }).format;
export const formatFullDate = new Intl.DateTimeFormat("en", { dateStyle: "full" }).format;
export const formatHour = new Intl.DateTimeFormat("en", { hour: "numeric" }).format;
