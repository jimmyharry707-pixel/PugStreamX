"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import "@/static/css/components/ps-calendar-time-grid.css";
import { formatFullDate, formatHour, formatWeekday, formatWeekdayNarrow, isSameDay, isWeekend } from "../dates";
import { layoutEvents } from "../event-layout";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** One block on the grid: a day and minutes since midnight, in the calendar's time zone. */
export type CalendarEvent = {
  /** Unique per block (an event crossing midnight has a block on each day). */
  key: string;
  /** The event's id, passed to onEventClick. */
  id: string;
  day: Date;
  start: number;
  end: number;
  title: string;
  /** "10:00 – 11:00 AM" */
  time: string;
  /** A second line, e.g. the client company. */
  detail?: string;
};

/**
 * The week: day headings on top and a scrolling 24-hour grid below, with a red line at the
 * current time in today's column. Weekend days are tinted. `today` and `nowMinutes` (minutes
 * since midnight) are in the calendar's time zone, which `zoneLabel` names ("GMT+8").
 * Events are drawn as blocks (overlapping ones side by side); clicking one calls `onEventClick`,
 * clicking an empty spot calls `onSlotClick` with that day and half hour.
 */
export function PsCalendarTimeGrid({
  days,
  today,
  nowMinutes,
  zoneLabel,
  events,
  onEventClick,
  onSlotClick,
}: {
  days: Date[];
  today: Date;
  nowMinutes: number;
  zoneLabel: string;
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
  onSlotClick: (day: Date, minutes: number) => void;
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
              <div
                key={day.getTime()}
                data-weekend={isWeekend(day) || undefined}
                // Clicking an empty spot creates an event there, at the half hour clicked.
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onSlotClick(day, Math.floor((((e.clientY - rect.top) / rect.height) * 1440) / 30) * 30);
                }}
                className="ps-calendar-time-grid__column"
              >
                {layoutEvents(events.filter((event) => isSameDay(event.day, day))).map((event) => {
                  const minutes = event.end - event.start;
                  return (
                    <button
                      key={event.key}
                      type="button"
                      aria-label={`${event.title}, ${event.time}${event.detail ? `, ${event.detail}` : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event.id);
                      }}
                      style={
                        {
                          "--ps-event-start": event.start / 1440,
                          "--ps-event-length": Math.max(minutes, 20) / 1440,
                          "--ps-event-column": event.column,
                          "--ps-event-columns": event.columns,
                        } as CSSProperties
                      }
                      className="ps-calendar-time-grid__event flex flex-col overflow-hidden rounded-md border-l-2 border-event-400 bg-event-900/80 px-1.5 py-0.5 text-left text-[11px] leading-tight text-event-50 transition hover:bg-event-800 focus-visible:outline-2 focus-visible:outline-brand-400"
                    >
                      <span className="truncate font-semibold">{event.title}</span>
                      {minutes >= 45 && <span className="truncate text-event-200">{event.time}</span>}
                      {minutes >= 75 && event.detail && <span className="truncate text-event-200">{event.detail}</span>}
                    </button>
                  );
                })}
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
