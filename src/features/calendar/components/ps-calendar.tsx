"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { addDays, parseDateKey, toDateKey, weekDays } from "../dates";
import { deviceTimeZone, setTimeZoneSetting, timeZoneOffset, useTimeZoneSetting, zonedTime } from "../time-zone";
import { useNow } from "../use-now";
import { PsCalendarTimeGrid } from "./ps-calendar-time-grid";
import { PsCalendarToolbar } from "./ps-calendar-toolbar";

/**
 * Google-Calendar-style week calendar, using the full width. The title in its toolbar opens a
 * month calendar popup for jumping to a week. The shown week lives in the URL
 * (`?date=2026-11-03`, any day of that week); without a date it shows this week. Moving
 * around updates the URL in the browser only (no server request).
 *
 * "Today" and the current-time line follow the time zone picked in the toolbar (remembered in
 * this browser; the device's by default).
 *
 * Keyboard shortcuts: T this week, J / N next week, K / P previous week.
 */
export function PsCalendar() {
  const searchParams = useSearchParams();
  const now = useNow();
  const timeZoneSetting = useTimeZoneSetting();
  const timeZone = timeZoneSetting === null ? null : timeZoneSetting || deviceTimeZone();
  // "Today" and the time of day, in the chosen time zone.
  const zoned = now && timeZone ? { ...zonedTime(now, timeZone), label: timeZoneOffset(timeZone, now, "short") } : null;
  const date = parseDateKey(searchParams.get("date")) ?? zoned?.day ?? null;

  const go = useCallback((nextDate: Date | null) => {
    window.history.pushState(null, "", nextDate ? `?date=${toDateKey(nextDate)}` : window.location.pathname);
  }, []);

  useEffect(() => {
    if (!date) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=alertdialog]")) return;
      const key = e.key.toLowerCase();
      if (key === "t") go(null);
      else if (key === "j" || key === "n") go(addDays(date, 7));
      else if (key === "k" || key === "p") go(addDays(date, -7));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, go]);

  // Today and the time zone are only known in the browser, so wait for them.
  if (!date || !zoned || timeZoneSetting === null) return <PsCalendarSkeleton />;

  return (
    // Fills the space below the 4rem topbar; the hour grid scrolls inside.
    <div className="flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col">
      <PsCalendarToolbar
        date={date}
        today={zoned.day}
        onGo={go}
        timeZone={timeZoneSetting}
        onTimeZoneChange={setTimeZoneSetting}
      />
      <PsCalendarTimeGrid days={weekDays(date)} today={zoned.day} nowMinutes={zoned.minutes} zoneLabel={zoned.label} />
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
