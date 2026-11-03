"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import "@/static/css/components/ps-calendar-time-grid.css";
import { formatFullDate, formatHour, formatWeekday, formatWeekdayNarrow, isSameDay, isWeekend } from "../dates";
import { layoutEvents } from "../event-layout";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** Dragging snaps to this many minutes. */
const DRAG_STEP = 15;
/** Pixels the pointer must move before a press becomes a drag (smaller is a click). */
const DRAG_THRESHOLD = 4;
/** Pixels from the top or bottom of the hours where dragging scrolls them. */
const EDGE = 32;

const timeFormat = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });
/** Minutes since midnight → "10:00 – 11:30 AM". */
const formatMinutesRange = (start: number, end: number) => timeFormat.formatRange(new Date(2000, 0, 1, 0, start), new Date(2000, 0, 1, 0, end));

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
  /** Shows a "Done" badge (the Caller has finished it). */
  done?: boolean;
};

/**
 * An event dragged to a new place: moved by `days` and `minutes` (wall clock, in the calendar's
 * zone), or resized so it ends `minutes` later (negative: earlier).
 */
export type EventChange = { mode: "move"; days: number; minutes: number } | { mode: "resize"; minutes: number };

/**
 * The week: day headings on top and a scrolling 24-hour grid below, with a red line at the
 * current time in today's column. Weekend days are tinted. `today` and `nowMinutes` (minutes
 * since midnight) are in the calendar's time zone, which `zoneLabel` names ("GMT+8").
 * Events are drawn as blocks (overlapping ones side by side); clicking one calls `onEventClick`.
 *
 * Empty space, like Google Calendar: drag up or down in a day (mouse or pen) to pick a time
 * range, snapped to 15 minutes, then `onSlotSelect(day, start, end)`. A plain click (or a tap)
 * calls `onSlotSelect(day, start)` with the half hour clicked. Touch drags keep scrolling.
 *
 * Events, like Google Calendar: drag one (mouse or pen) to another time or day, or drag its
 * bottom edge to change when it ends, snapped to 15 minutes; then `onEventChange`. Esc cancels.
 *
 * Without `editable` (people who may only look), empty space does nothing and events can't be
 * dragged; clicking an event still opens it.
 */
export function PsCalendarTimeGrid({
  days,
  today,
  nowMinutes,
  zoneLabel,
  events,
  editable = true,
  onEventClick,
  onEventChange,
  onSlotSelect,
}: {
  editable?: boolean;
  days: Date[];
  today: Date;
  nowMinutes: number;
  zoneLabel: string;
  events: CalendarEvent[];
  onEventClick: (id: string) => void;
  onEventChange: (id: string, change: EventChange) => void;
  onSlotSelect: (day: Date, start: number, end?: number) => void;
}) {
  const columnsRef = useRef<HTMLDivElement>(null);
  // The event being moved or resized, like the range above.
  const eventDragRef = useRef<{
    event: CalendarEvent;
    mode: "move" | "resize";
    dayIndex: number;
    startX: number;
    startY: number;
    /** Minutes into the day where the pointer went down (content position, so scrolling is fine). */
    startAt: number;
    preview: { dayIndex: number; start: number; end: number } | null;
  } | null>(null);
  const [eventPreview, setEventPreview] = useState<{ key: string; title: string; dayIndex: number; start: number; end: number } | null>(null);
  const skipEventClick = useRef(false);

  /** Minutes into the day at a height, unrounded and unclamped. */
  const pointerMinutes = (clientY: number) => {
    const rect = columnsRef.current!.getBoundingClientRect();
    return ((clientY - rect.top) / rect.height) * 1440;
  };

  const cancelEventDrag = () => {
    if (eventDragRef.current?.preview) skipEventClick.current = true;
    eventDragRef.current = null;
    setEventPreview(null);
  };

  // Esc cancels a move or resize.
  useEffect(() => {
    if (!eventPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cancelEventDrag();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [eventPreview]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const startMinutes = useRef(nowMinutes);
  // The range being dragged: in a ref for the pointer handlers, in state to draw it.
  const dragRef = useRef<{ dayIndex: number; anchor: number; startY: number; range: { start: number; end: number } | null } | null>(null);
  const [draft, setDraft] = useState<{ dayIndex: number; start: number; end: number } | null>(null);
  // A drag ends with a click event too; skip that one.
  const skipClick = useRef(false);
  const pressOnEvent = useRef(false);

  /** Minutes since midnight at a point in a day column, rounded down to `step`. */
  const minutesAt = (column: HTMLElement, clientY: number, step: number) => {
    const rect = column.getBoundingClientRect();
    const minutes = Math.min(Math.max(((clientY - rect.top) / rect.height) * 1440, 0), 1439);
    return Math.floor(minutes / step) * step;
  };

  /** While dragging near the top or bottom edge, scroll the hours. */
  const scrollNearEdge = (clientY: number) => {
    const body = bodyRef.current;
    if (!body) return;
    const rect = body.getBoundingClientRect();
    if (clientY < rect.top + EDGE) body.scrollTop -= 16;
    else if (clientY > rect.bottom - EDGE) body.scrollTop += 16;
  };

  const endDrag = () => {
    dragRef.current = null;
    setDraft(null);
  };

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
          <div ref={columnsRef} className={cn("grid flex-1 grid-cols-7", eventPreview && "cursor-grabbing select-none")}>
            {days.map((day, dayIndex) => (
              <div
                key={day.getTime()}
                data-weekend={isWeekend(day) || undefined}
                onPointerDown={(e) => {
                  // A press that starts on an event never creates one, even if released on empty space.
                  pressOnEvent.current = !!(e.target as Element).closest(".ps-calendar-time-grid__event");
                  if (!editable || pressOnEvent.current || e.button !== 0 || e.pointerType === "touch") return;
                  e.preventDefault(); // no text selection while dragging
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragRef.current = { dayIndex, anchor: minutesAt(e.currentTarget, e.clientY, DRAG_STEP), startY: e.clientY, range: null };
                }}
                onPointerMove={(e) => {
                  const drag = dragRef.current;
                  if (!drag || (!drag.range && Math.abs(e.clientY - drag.startY) < DRAG_THRESHOLD)) return;
                  const at = minutesAt(e.currentTarget, e.clientY, DRAG_STEP);
                  drag.range = { start: Math.min(drag.anchor, at), end: Math.max(drag.anchor, at) + DRAG_STEP };
                  setDraft({ dayIndex, ...drag.range });
                  scrollNearEdge(e.clientY);
                }}
                onPointerUp={() => {
                  const range = dragRef.current?.range;
                  endDrag();
                  if (!range) return;
                  skipClick.current = true;
                  setTimeout(() => (skipClick.current = false));
                  onSlotSelect(day, range.start, range.end);
                }}
                onPointerCancel={endDrag}
                onClick={(e) => {
                  if (!editable || skipClick.current || pressOnEvent.current || (e.target as Element).closest(".ps-calendar-time-grid__event")) return;
                  onSlotSelect(day, minutesAt(e.currentTarget, e.clientY, 30));
                }}
                className={cn("ps-calendar-time-grid__column", draft && "select-none", !editable && "cursor-default")}
              >
                {draft?.dayIndex === dayIndex && (
                  <div
                    aria-hidden
                    style={{ "--ps-event-start": draft.start / 1440, "--ps-event-length": (draft.end - draft.start) / 1440, "--ps-event-column": 0, "--ps-event-columns": 1 } as CSSProperties}
                    className="ps-calendar-time-grid__event ps-calendar-time-grid__draft flex flex-col overflow-hidden rounded-md border-l-2 border-event-300 bg-event-600/80 px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-lg shadow-black/40"
                  >
                    <span className="truncate font-semibold">(No title)</span>
                    <span className="truncate">{formatMinutesRange(draft.start, draft.end)}</span>
                  </div>
                )}
                {eventPreview?.dayIndex === dayIndex && (
                  <div
                    aria-hidden
                    style={{ "--ps-event-start": eventPreview.start / 1440, "--ps-event-length": Math.max(eventPreview.end - eventPreview.start, 20) / 1440, "--ps-event-column": 0, "--ps-event-columns": 1 } as CSSProperties}
                    className="ps-calendar-time-grid__event ps-calendar-time-grid__draft flex flex-col overflow-hidden rounded-md border-l-2 border-event-300 bg-event-600/90 px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-lg shadow-black/40"
                  >
                    <span className="truncate font-semibold">{eventPreview.title}</span>
                    <span className="truncate">{formatMinutesRange(eventPreview.start, eventPreview.end)}</span>
                  </div>
                )}
                {layoutEvents(events.filter((event) => isSameDay(event.day, day))).map((event) => {
                  const minutes = event.end - event.start;
                  return (
                    <button
                      key={event.key}
                      type="button"
                      aria-label={`${event.title}, ${event.time}${event.detail ? `, ${event.detail}` : ""}${event.done ? ", done" : ""}`}
                      data-done={event.done || undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!skipEventClick.current) onEventClick(event.id);
                      }}
                      onPointerDown={(e) => {
                        skipEventClick.current = false; // a new press starts fresh (even after Esc)
                        if (!editable || e.button !== 0 || e.pointerType === "touch") return;
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        eventDragRef.current = {
                          event,
                          mode: (e.target as Element).closest(".ps-calendar-time-grid__resize") ? "resize" : "move",
                          dayIndex,
                          startX: e.clientX,
                          startY: e.clientY,
                          startAt: pointerMinutes(e.clientY),
                          preview: null,
                        };
                      }}
                      onPointerMove={(e) => {
                        const drag = eventDragRef.current;
                        if (!drag || drag.event.key !== event.key) return;
                        if (!drag.preview && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
                        const delta = Math.round((pointerMinutes(e.clientY) - drag.startAt) / DRAG_STEP) * DRAG_STEP;
                        const { start, end } = drag.event;
                        if (drag.mode === "resize") {
                          drag.preview = { dayIndex: drag.dayIndex, start, end: Math.min(Math.max(end + delta, start + DRAG_STEP), 1440) };
                        } else {
                          const rect = columnsRef.current!.getBoundingClientRect();
                          const toDay = Math.min(Math.max(Math.floor(((e.clientX - rect.left) / rect.width) * days.length), 0), days.length - 1);
                          const newStart = Math.min(Math.max(start + delta, 0), 1440 - DRAG_STEP);
                          drag.preview = { dayIndex: toDay, start: newStart, end: Math.min(newStart + (end - start), 1440) };
                        }
                        setEventPreview({ key: event.key, title: event.title, ...drag.preview });
                        scrollNearEdge(e.clientY);
                      }}
                      onPointerUp={() => {
                        const drag = eventDragRef.current;
                        eventDragRef.current = null;
                        setEventPreview(null);
                        if (!drag?.preview) return; // a click: opens the details
                        // The click that ends a drag mustn't open the details.
                        skipEventClick.current = true;
                        setTimeout(() => (skipEventClick.current = false));
                        const { preview, event: from } = drag;
                        if (drag.mode === "resize") {
                          if (preview.end !== from.end) onEventChange(from.id, { mode: "resize", minutes: preview.end - from.end });
                        } else if (preview.dayIndex !== drag.dayIndex || preview.start !== from.start) {
                          onEventChange(from.id, { mode: "move", days: preview.dayIndex - drag.dayIndex, minutes: preview.start - from.start });
                        }
                      }}
                      onPointerCancel={cancelEventDrag}
                      style={
                        {
                          "--ps-event-start": event.start / 1440,
                          "--ps-event-length": Math.max(minutes, 20) / 1440,
                          "--ps-event-column": event.column,
                          "--ps-event-columns": event.columns,
                        } as CSSProperties
                      }
                      className={cn(
                        "ps-calendar-time-grid__event flex flex-col overflow-hidden rounded-md border-l-2 border-event-400 bg-event-900/80 px-1.5 py-0.5 text-left text-[11px] leading-tight text-event-50 transition hover:bg-event-800 focus-visible:outline-2 focus-visible:outline-brand-400",
                        // While it's being dragged, the original stays as a faint outline.
                        eventPreview?.key === event.key && "opacity-40",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1">
                        <span className="truncate font-semibold">{event.title}</span>
                        {event.done && (
                          <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-500/20 px-1.5 text-[10px] font-semibold text-success-300 ring-1 ring-inset ring-success-400/40">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-2.5" aria-hidden>
                              <path d="m5 12 5 5 9-10" />
                            </svg>
                            Done
                          </span>
                        )}
                      </span>
                      {minutes >= 45 && <span className="truncate text-event-200">{event.time}</span>}
                      {minutes >= 75 && event.detail && <span className="truncate text-event-200">{event.detail}</span>}
                      {/* Drag the bottom edge to change when it ends. */}
                      {editable && <span aria-hidden className="ps-calendar-time-grid__resize" />}
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
