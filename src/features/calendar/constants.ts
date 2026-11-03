export const CALENDAR_PATH = "/calendar";

/** Calendar views, in the order the view switcher shows them. Picked with `?view=`. */
export const CALENDAR_VIEWS = ["day", "week", "month"] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];
export const DEFAULT_CALENDAR_VIEW: CalendarView = "month";

export const CALENDAR_VIEW_LABELS: Record<CalendarView, string> = { day: "Day", week: "Week", month: "Month" };

/** Keyboard shortcuts (as in Google Calendar) for switching views. */
export const CALENDAR_VIEW_KEYS: Record<CalendarView, string> = { day: "d", week: "w", month: "m" };

/** First day of the week: 0 = Sunday. */
export const WEEK_STARTS_ON = 0;
