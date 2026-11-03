"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import "@/static/css/components/ps-calendar-time-grid.css";
import { formatFullDate, formatHour, formatWeekday, formatWeekdayNarrow, isSameDay, isWeekend } from "../dates";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/**
 * The week: day headings on top and a scrolling 24-hour grid below, with a red line at the
 * current time in today's column. Weekend days are tinted. `today` and `nowMinutes` (minutes
 * since midnight) are in the calendar's time zone, which `zoneLabel` names ("GMT+8").
 */
export function PsCalendarTimeGrid({
  days,
  today,
  nowMinutes,
  zoneLabel,
}: {
  days: Date[];
  today: Date;
  nowMinutes: number;
  zoneLabel: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const startMinutes = useRef(nowMinutes);

  // Start scrolled to an hour before now, like Google Calendar.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = Math.max(0, Math.floor(startMinutes.current / 60) - 1) * (body.scrollHeight / 24);
  }, []);

  return (
    <div className="ps-calendar-time-grid flex min-h-0 flex-1 flex-col">
      <div className="ps-calendar-time-grid__head flex border-b border-white/10">
        <div className="ps-calendar-time-grid__gutter flex shrink-0 items-end justify-end pb-1.5 pr-2 text-[10px] text-gray-500">
          <span title="Time zone">{zoneLabel}</span>
        </div>
        <div className="grid flex-1 grid-cols-7">
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            const weekend = isWeekend(day);
            return (
              <div
                key={day.getTime()}
                aria-current={isToday ? "date" : undefined}
                data-weekend={weekend || undefined}
                className="ps-calendar-time-grid__day flex min-w-0 flex-col items-center gap-1 py-2"
              >
                <span className="sr-only">{formatFullDate(day)}</span>
                <span
                  aria-hidden
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wide",
                    isToday ? "text-brand-300" : weekend ? "text-weekend-300/80" : "text-gray-500",
                  )}
                >
                  <span className="sm:hidden">{formatWeekdayNarrow(day)}</span>
                  <span className="max-sm:hidden">{formatWeekday(day)}</span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-base font-medium sm:size-11 sm:text-2xl",
                    isToday ? "bg-brand-400 text-gray-950" : weekend ? "text-weekend-200" : "text-gray-200",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={bodyRef} className="ps-calendar-time-grid__body min-h-0 flex-1">
        <div className="flex">
          <div className="ps-calendar-time-grid__gutter shrink-0" aria-hidden>
            {HOURS.map((hour) => (
              <div key={hour} className="ps-calendar-time-grid__hour">
                {/* The first line is the top edge, so midnight has no label. */}
                {hour > 0 && <span className="ps-calendar-time-grid__hour-label">{formatHour(new Date(2000, 0, 1, hour))}</span>}
              </div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-7">
            {days.map((day) => (
              <div key={day.getTime()} data-weekend={isWeekend(day) || undefined} className="ps-calendar-time-grid__column">
                {isSameDay(day, today) && (
                  <div
                    className="ps-calendar-time-grid__now"
                    style={{ "--ps-calendar-now": nowMinutes / 1440 } as CSSProperties}
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
