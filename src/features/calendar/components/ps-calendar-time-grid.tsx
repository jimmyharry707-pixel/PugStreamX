"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import "@/static/css/components/ps-calendar-time-grid.css";
import { formatFullDate, formatHour, formatWeekday, formatWeekdayNarrow, isSameDay } from "../dates";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/**
 * Week and Day views: day headings on top and a scrolling 24-hour grid below, with a red line
 * at the current time in today's column.
 */
export function PsCalendarTimeGrid({
  days,
  now,
  onOpenDay,
}: {
  days: Date[];
  now: Date | null;
  onOpenDay: (day: Date) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Start scrolled to an hour before now, like Google Calendar.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = Math.max(0, new Date().getHours() - 1) * (body.scrollHeight / 24);
  }, []);

  const week = days.length > 1;
  const columns = cn("grid flex-1", week ? "grid-cols-7" : "grid-cols-1");

  return (
    <div className="ps-calendar-time-grid flex min-h-0 flex-1 flex-col">
      <div className="ps-calendar-time-grid__head flex border-b border-white/10">
        <div className="ps-calendar-time-grid__gutter shrink-0" />
        <div className={columns}>
          {days.map((day) => {
            const isToday = isSameDay(day, now);
            return (
              <div key={day.getTime()} className="flex min-w-0 flex-col items-center gap-1 py-2">
                <span className={cn("text-[11px] font-medium uppercase tracking-wide", isToday ? "text-amber-300" : "text-zinc-500")}>
                  {week ? (
                    <>
                      <span className="sm:hidden">{formatWeekdayNarrow(day)}</span>
                      <span className="max-sm:hidden">{formatWeekday(day)}</span>
                    </>
                  ) : (
                    formatWeekday(day)
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={formatFullDate(day)}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-base font-medium transition sm:size-11 sm:text-2xl",
                    isToday ? "bg-amber-400 text-zinc-950 hover:bg-amber-300" : "text-zinc-200 hover:bg-white/10",
                  )}
                >
                  {day.getDate()}
                </button>
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
          <div className={columns}>
            {days.map((day) => (
              <div key={day.getTime()} className="ps-calendar-time-grid__column">
                {now && isSameDay(day, now) && (
                  <div
                    className="ps-calendar-time-grid__now"
                    style={{ "--ps-calendar-now": (now.getHours() * 60 + now.getMinutes()) / 1440 } as CSSProperties}
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
