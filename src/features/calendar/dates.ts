import { WEEK_STARTS_ON, type CalendarView } from "./constants";

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

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * The weeks shown for a month: from the week holding the 1st to the week holding the last day
 * (4 to 6 weeks). `fixed` always returns 6 weeks, so a small calendar keeps its height.
 */
export function monthWeeks(date: Date, { fixed = false } = {}): Date[][] {
  const first = startOfMonth(date);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  for (let start = startOfWeek(first); fixed ? weeks.length < 6 : start <= last; start = addDays(start, 7)) {
    weeks.push(weekDays(start));
  }
  return weeks;
}

/** The date one step before (-1) or after (1) in a view: a day, a week or a month. */
export function shiftDate(view: CalendarView, date: Date, step: -1 | 1): Date {
  if (view === "day") return addDays(date, step);
  if (view === "week") return addDays(date, 7 * step);
  return addMonths(date, step);
}

const monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const shortMonth = new Intl.DateTimeFormat("en", { month: "short" });
const shortMonthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
const fullDate = new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" });

/** Toolbar title: "November 2026", "Nov – Dec 2026", "Dec 2026 – Jan 2027" or "November 3, 2026". */
export function calendarTitle(view: CalendarView, date: Date): string {
  if (view === "day") return fullDate.format(date);
  if (view === "month") return monthYear.format(date);
  const days = weekDays(date);
  const [first, last] = [days[0], days[6]];
  if (isSameMonth(first, last)) return monthYear.format(first);
  if (first.getFullYear() === last.getFullYear()) {
    return `${shortMonth.format(first)} – ${shortMonthYear.format(last)}`;
  }
  return `${shortMonthYear.format(first)} – ${shortMonthYear.format(last)}`;
}

export const formatWeekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format;
export const formatWeekdayNarrow = new Intl.DateTimeFormat("en", { weekday: "narrow" }).format;
export const formatFullDate = new Intl.DateTimeFormat("en", { dateStyle: "full" }).format;
export const formatShortMonth = shortMonth.format;
export const formatHour = new Intl.DateTimeFormat("en", { hour: "numeric" }).format;
