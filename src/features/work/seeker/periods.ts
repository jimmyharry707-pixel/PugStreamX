// Bid count periods (day, week, month). Pure, safe on the server and in the browser.
import { addDays, addMonths, startOfMonth, startOfWeek, toDateKey } from "@/features/scheduling/calendar/dates";

export const BID_PERIODS = ["day", "week", "month"] as const;
export type BidPeriod = (typeof BID_PERIODS)[number];
export const BID_PERIOD_LABELS: Record<BidPeriod, string> = { day: "Daily", week: "Weekly", month: "Monthly" };

/** How many periods one screen shows. */
export const PERIODS_SHOWN: Record<BidPeriod, number> = { day: 14, week: 12, month: 12 };
/** How far back "Earlier" can go (screens). */
export const PERIOD_OFFSET_MAX = 520;

/** One period: its first day and the day after its last ("YYYY-MM-DD", in the chosen zone). */
export type PeriodRange = { start: string; end: string };

/**
 * The periods on one screen, oldest first, ending with the one that holds `today` (a local
 * calendar day, see dates.ts), moved back by `offset` screens. Weeks start on Monday.
 */
export function periodRanges(period: BidPeriod, today: Date, offset: number): PeriodRange[] {
  const n = PERIODS_SHOWN[period];
  const step = (date: Date, by: number) => (period === "day" ? addDays(date, by) : period === "week" ? addDays(date, by * 7) : addMonths(date, by));
  const current = period === "day" ? today : period === "week" ? startOfWeek(today) : startOfMonth(today);
  const last = step(current, -offset * n);
  return Array.from({ length: n }, (_, i) => {
    const start = step(last, i - (n - 1));
    return { start: toDateKey(start), end: toDateKey(step(start, 1)) };
  });
}

/** Parses a "YYYY-MM-DD" key as a local date (no time zone shift). */
const day = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dayFormat = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" });
const shortFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

/** "Wed, Nov 4" · "Nov 2 – 8" · "November 2026" */
export function periodLabel(period: BidPeriod, range: PeriodRange): string {
  if (period === "day") return dayFormat.format(day(range.start));
  if (period === "month") return monthFormat.format(day(range.start));
  return shortFormat.formatRange(day(range.start), addDays(day(range.end), -1));
}
