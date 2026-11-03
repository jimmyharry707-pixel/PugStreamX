"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PsDialog } from "@/components/ui/ps-dialog";
import { PsScheduleDetails } from "@/features/schedules/components/ps-schedule-details";
import { PsScheduleForm, type ScheduleFormDefaults } from "@/features/schedules/components/ps-schedule-form";
import { formatTimeRange, minutesToTime } from "@/features/schedules/format";
import type { Schedule } from "@/features/schedules/types";
import { useSchedules } from "@/features/schedules/use-schedules";
import { snackbar } from "@/features/snackbar/store";
import { zonedTime, zonedToUtc } from "@/lib/utils/time-zone";
import { addDays, isSameDay, parseDateKey, toDateKey, weekDays } from "../dates";
import { deviceTimeZone, setTimeZoneSetting, timeZoneName, timeZoneOffset, useTimeZoneSetting } from "../time-zone";
import { useNow } from "../use-now";
import { PsCalendarTimeGrid, type CalendarEvent } from "./ps-calendar-time-grid";
import { PsCalendarToolbar } from "./ps-calendar-toolbar";

type DialogState =
  | { mode: "create"; defaults: ScheduleFormDefaults }
  | { mode: "view"; schedule: Schedule }
  | { mode: "edit"; schedule: Schedule };

/** A schedule as blocks on the grid, in `timeZone`: one block, or two if it crosses midnight. */
function toEvents(schedule: Schedule, timeZone: string): CalendarEvent[] {
  const start = zonedTime(new Date(schedule.start), timeZone);
  const end = zonedTime(new Date(schedule.end), timeZone);
  const base = {
    id: schedule.id,
    title: schedule.title,
    time: formatTimeRange(new Date(schedule.start), new Date(schedule.end), timeZone),
    detail: schedule.clientCompany,
  };
  if (isSameDay(start.day, end.day)) return [{ ...base, key: schedule.id, day: start.day, start: start.minutes, end: end.minutes }];
  return [
    { ...base, key: `${schedule.id}-a`, day: start.day, start: start.minutes, end: 1440 },
    ...(end.minutes > 0 ? [{ ...base, key: `${schedule.id}-b`, day: end.day, start: 0, end: end.minutes }] : []),
  ];
}

/**
 * Google-Calendar-style week calendar of the member's schedules, using the full width. The
 * title in its toolbar opens a month calendar popup for jumping to a week. The shown week lives
 * in the URL (`?date=2026-11-03`, any day of that week); without a date it shows this week.
 * Moving around updates the URL in the browser only (no server request).
 *
 * "Today", the current-time line and schedule times follow the time zone picked in the toolbar
 * (remembered in this browser; the device's by default).
 *
 * Schedules: Create (or click an empty spot) opens the form; click a schedule for its details,
 * then Edit or Delete.
 *
 * Keyboard shortcuts: T this week, J / N next week, K / P previous week, C create.
 */
export function PsCalendar() {
  const searchParams = useSearchParams();
  const now = useNow();
  const timeZoneSetting = useTimeZoneSetting();
  const timeZone = timeZoneSetting === null ? null : timeZoneSetting || deviceTimeZone();
  // "Today" and the time of day, in the chosen time zone.
  const zoned = now && timeZone ? { ...zonedTime(now, timeZone), label: timeZoneOffset(timeZone, now, "short") } : null;
  const date = parseDateKey(searchParams.get("date")) ?? zoned?.day ?? null;
  const [dialog, setDialog] = useState<DialogState | null>(null);

  // The shown week as exact moments in the chosen zone, to load its schedules.
  const weekKey = date ? toDateKey(weekDays(date)[0]) : null;
  const range = useMemo(() => {
    if (!weekKey || !timeZone) return null;
    const nextWeek = toDateKey(addDays(parseDateKey(weekKey)!, 7));
    return { from: zonedToUtc(weekKey, "00:00", timeZone), to: zonedToUtc(nextWeek, "00:00", timeZone) };
  }, [weekKey, timeZone]);
  const { schedules, failed, reload } = useSchedules(range);

  useEffect(() => {
    if (failed) snackbar.error("Couldn't load your schedules. Check your connection and reload the page.");
  }, [failed]);

  const go = useCallback((nextDate: Date | null) => {
    window.history.pushState(null, "", nextDate ? `?date=${toDateKey(nextDate)}` : window.location.pathname);
  }, []);

  /**
   * Opens the form for a new schedule: on `day` at `minutes`, else at the next hour today (or
   * 9 AM on the week's first day when another week is shown).
   */
  const create = (day?: Date, minutes?: number) => {
    if (!date || !zoned) return;
    const days = weekDays(date);
    const onToday = days.some((d) => isSameDay(d, zoned.day));
    const target = day ?? (onToday ? zoned.day : days[0]);
    const from = minutes ?? (day || !onToday ? 9 * 60 : Math.min(Math.ceil(zoned.minutes / 60) * 60, 23 * 60));
    setDialog({ mode: "create", defaults: { date: toDateKey(target), from: minutesToTime(from), to: minutesToTime(from + 60) } });
  };
  // The key handler below reads the latest `create` without re-subscribing every render.
  const createRef = useRef(create);
  useEffect(() => {
    createRef.current = create;
  });

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
      else if (key === "c") createRef.current();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, go]);

  // Today and the time zone are only known in the browser, so wait for them.
  if (!date || !zoned || !timeZone || timeZoneSetting === null) return <PsCalendarSkeleton />;

  const zoneLabel = `${timeZoneOffset(timeZone, now!, "long")} (${timeZoneName(timeZone)})`;
  const events = schedules.flatMap((schedule) => toEvents(schedule, timeZone));

  const onSaved = (schedule: Schedule, created: boolean) => {
    setDialog(null);
    snackbar.success(created ? "Schedule created." : "Schedule saved.");
    // Show the week holding the saved schedule.
    const day = zonedTime(new Date(schedule.start), timeZone).day;
    if (!weekDays(date).some((d) => isSameDay(d, day))) go(day);
    reload();
  };

  /** The form's values for editing a schedule, in the chosen zone. */
  const editDefaults = (schedule: Schedule): ScheduleFormDefaults => {
    const start = zonedTime(new Date(schedule.start), timeZone);
    const end = zonedTime(new Date(schedule.end), timeZone);
    return {
      title: schedule.title,
      date: toDateKey(start.day),
      from: minutesToTime(start.minutes),
      // A schedule crossing midnight (only after changing time zone) is cut at the day's end.
      to: minutesToTime(isSameDay(start.day, end.day) ? end.minutes : 23 * 60 + 59),
      clientCompany: schedule.clientCompany,
      interviewer: schedule.interviewer,
      resumeUrl: schedule.resumeUrl,
      jobDescriptionUrl: schedule.jobDescriptionUrl,
      screenShareUrl: schedule.screenShareUrl ?? "",
      note: schedule.note ?? "",
    };
  };

  return (
    // Fills the space below the 4rem topbar; the hour grid scrolls inside.
    <div className="flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col">
      <PsCalendarToolbar
        date={date}
        today={zoned.day}
        onGo={go}
        onCreate={() => create()}
        timeZone={timeZoneSetting}
        onTimeZoneChange={setTimeZoneSetting}
      />
      <PsCalendarTimeGrid
        days={weekDays(date)}
        today={zoned.day}
        nowMinutes={zoned.minutes}
        zoneLabel={zoned.label}
        events={events}
        onEventClick={(id) => {
          const schedule = schedules.find((s) => s.id === id);
          if (schedule) setDialog({ mode: "view", schedule });
        }}
        onSlotClick={(day, minutes) => create(day, minutes)}
      />

      {/* Phones: Create floats at the bottom right, like Google Calendar. */}
      <button
        type="button"
        aria-label="Create schedule"
        onClick={() => create()}
        className="fixed bottom-5 right-5 z-10 grid size-14 place-items-center rounded-2xl bg-brand-400 text-gray-950 shadow-lg shadow-black/40 transition hover:bg-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 sm:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" className="size-6" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {dialog?.mode === "view" && (
        <PsDialog title={dialog.schedule.title} onClose={() => setDialog(null)}>
          <PsScheduleDetails
            schedule={dialog.schedule}
            timeZone={timeZone}
            zoneLabel={zoneLabel}
            onEdit={() => setDialog({ mode: "edit", schedule: dialog.schedule })}
            onDeleted={(message) => {
              setDialog(null);
              snackbar.success(message);
              reload();
            }}
          />
        </PsDialog>
      )}
      {(dialog?.mode === "create" || dialog?.mode === "edit") && (
        <PsDialog
          title={dialog.mode === "create" ? "New schedule" : "Edit schedule"}
          onClose={() => setDialog(null)}
          initialFocus='input[name="title"]'
        >
          <PsScheduleForm
            scheduleId={dialog.mode === "edit" ? dialog.schedule.id : undefined}
            defaults={dialog.mode === "edit" ? editDefaults(dialog.schedule) : dialog.defaults}
            timeZone={timeZone}
            zoneLabel={zoneLabel}
            onSaved={(schedule) => onSaved(schedule, dialog.mode === "create")}
            onCancel={() => setDialog(null)}
          />
        </PsDialog>
      )}
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
