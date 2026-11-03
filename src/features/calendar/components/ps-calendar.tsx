"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { CALENDAR_VIEW_KEYS, CALENDAR_VIEWS, DEFAULT_CALENDAR_VIEW, type CalendarView } from "../constants";
import { calendarTitle, parseDateKey, shiftDate, startOfDay, toDateKey, weekDays } from "../dates";
import { useNow } from "../use-now";
import { PsCalendarMonthView } from "./ps-calendar-month-view";
import { PsCalendarTimeGrid } from "./ps-calendar-time-grid";
import { PsCalendarToolbar } from "./ps-calendar-toolbar";
import { PsMiniCalendar } from "./ps-mini-calendar";

/**
 * Google-Calendar-style calendar with Day, Week and Month views and a small month calendar
 * on wide screens. The view and date live in the URL (`?view=week&date=2026-11-03`); without a
 * date it shows today. Moving around updates the URL in the browser only (no server request).
 *
 * Keyboard shortcuts: T today, J / N next, K / P previous, D / W / M switch view.
 */
export function PsCalendar() {
  const searchParams = useSearchParams();
  const now = useNow();
  const view = CALENDAR_VIEWS.find((v) => v === searchParams.get("view")) ?? DEFAULT_CALENDAR_VIEW;
  const today = now && startOfDay(now);
  const date = parseDateKey(searchParams.get("date")) ?? today;

  const go = useCallback((nextView: CalendarView, nextDate: Date | null) => {
    const params = new URLSearchParams();
    if (nextView !== DEFAULT_CALENDAR_VIEW) params.set("view", nextView);
    if (nextDate) params.set("date", toDateKey(nextDate));
    const query = params.toString();
    window.history.pushState(null, "", query ? `?${query}` : window.location.pathname);
  }, []);

  useEffect(() => {
    if (!date) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=alertdialog]")) return;
      const key = e.key.toLowerCase();
      const nextView = CALENDAR_VIEWS.find((v) => CALENDAR_VIEW_KEYS[v] === key);
      if (key === "t") go(view, null);
      else if (key === "j" || key === "n") go(view, shiftDate(view, date, 1));
      else if (key === "k" || key === "p") go(view, shiftDate(view, date, -1));
      else if (nextView) go(nextView, date);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, view, go]);

  // Today is only known in the browser (the user's time zone), so wait for it.
  if (!date) return <PsCalendarSkeleton />;

  const openDay = (day: Date) => go("day", day);

  return (
    // Fills the screen below the 4rem topbar; the views scroll inside.
    <div className="flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col">
      <PsCalendarToolbar
        view={view}
        title={calendarTitle(view, date)}
        onToday={() => go(view, null)}
        onStep={(step) => go(view, shiftDate(view, date, step))}
        onView={(v) => go(v, date)}
      />
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Date picker" className="hidden w-64 shrink-0 overflow-y-auto border-r border-white/10 p-4 xl:block">
          <PsMiniCalendar selected={date} today={today} onSelect={(day) => go(view, day)} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          {view === "month" ? (
            <PsCalendarMonthView date={date} today={today} onOpenDay={openDay} />
          ) : (
            <PsCalendarTimeGrid days={view === "week" ? weekDays(date) : [date]} now={now} onOpenDay={openDay} />
          )}
        </div>
      </div>
    </div>
  );
}

function PsCalendarSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col" aria-busy="true">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:px-6">
        <div className="h-8 w-20 animate-pulse rounded-full bg-white/5" />
        <div className="h-6 w-40 animate-pulse rounded bg-white/5" />
      </div>
      <div className="flex-1" />
    </div>
  );
}
