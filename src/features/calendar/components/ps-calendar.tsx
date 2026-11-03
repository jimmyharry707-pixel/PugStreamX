"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PsDialog } from "@/components/ui/ps-dialog";
import { PsSelect } from "@/components/ui/ps-select";
import { GROUP_PARAM } from "@/features/groups/constants";
import type { Group } from "@/features/groups/types";
import { PsScheduleDetails } from "@/features/schedules/components/ps-schedule-details";
import { PsScheduleForm, type ScheduleFormDefaults } from "@/features/schedules/components/ps-schedule-form";
import { reschedule } from "@/features/schedules/actions";
import { SCHEDULES_API_PATH } from "@/features/schedules/constants";
import { formatShortDate, formatTimeRange, minutesToTime } from "@/features/schedules/format";
import type { CalendarMode, Schedule } from "@/features/schedules/types";
import { useSchedules } from "@/features/schedules/use-schedules";
import { snackbar } from "@/features/snackbar/store";
import { zonedTime, zonedToUtc } from "@/lib/utils/time-zone";
import { addDays, isSameDay, parseDateKey, toDateKey, weekDays } from "../dates";
import { deviceTimeZone, setTimeZoneSetting, timeZoneOffset, useTimeZoneSetting } from "../time-zone";
import { useNow } from "../use-now";
import { PsCalendarTimeGrid, type CalendarEvent, type EventChange } from "./ps-calendar-time-grid";
import { PsCalendarToolbar } from "./ps-calendar-toolbar";

type DialogState =
  | { mode: "create"; defaults: ScheduleFormDefaults & { timeZone: string } }
  /** `back`: the schedules this one was opened from through links, newest last. */
  | { mode: "view"; schedule: Schedule; back: Schedule[] }
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
 * Google-Calendar-style week calendar of a group's schedules, using the full width. The
 * title in its toolbar opens a month calendar popup for jumping to a week. The shown week lives
 * in the URL (`?date=2026-11-03`, any day of that week); without a date it shows this week.
 * Moving around updates the URL in the browser only (no server request).
 *
 * "Today", the current-time line and schedule times follow the time zone picked in the toolbar
 * (remembered in this browser; the device's by default).
 *
 * What the viewer can do depends on `mode` (decided on the server, access.ts):
 * - "manage" (Profile Manager): Create (or click or drag in an empty spot) opens the form; click a
 *   schedule for its details, then Edit or Delete; drag a schedule (or its bottom edge) to move it.
 * - "call" (Caller): see schedules; in the details, add the screen share link and a caller note.
 * - "view" (super-admin): see any group's calendar, picked from `groups` (`?group=<id>`).
 *
 * Keyboard shortcuts: T this week, J / N next week, K / P previous week, C create (manage only).
 */
export function PsCalendar({ mode, groups = [] }: { mode: CalendarMode; groups?: Group[] }) {
  const searchParams = useSearchParams();
  const manage = mode === "manage";
  // Super-admins view one group at a time: the one in the URL, else the first.
  const requestedGroup = searchParams.get(GROUP_PARAM);
  const viewedGroup = mode === "view" ? (groups.find((g) => g.id === requestedGroup) ?? groups[0] ?? null) : null;
  const groupQuery = viewedGroup ? `${GROUP_PARAM}=${viewedGroup.id}` : null;
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
  const { schedules, failed, reload, patch } = useSchedules(range, groupQuery);

  useEffect(() => {
    if (failed) snackbar.error("Couldn't load the schedules. Check your connection and reload the page.");
  }, [failed]);

  /** Changes the URL's search params (keeping the others) without a page request. */
  const setParams = useCallback((changes: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    window.history.pushState(null, "", query ? `?${query}` : window.location.pathname);
  }, []);
  const go = useCallback((nextDate: Date | null) => setParams({ date: nextDate ? toDateKey(nextDate) : null }), [setParams]);

  /**
   * Opens the form for a new schedule: on `day` from `minutes` to `endMinutes` (an hour if not
   * given), else at the next hour today (or 9 AM on the week's first day when another week is shown).
   */
  const create = (day?: Date, minutes?: number, endMinutes?: number) => {
    if (!manage || !date || !zoned || !timeZone) return;
    const days = weekDays(date);
    const onToday = days.some((d) => isSameDay(d, zoned.day));
    const target = day ?? (onToday ? zoned.day : days[0]);
    const from = minutes ?? (day || !onToday ? 9 * 60 : Math.min(Math.ceil(zoned.minutes / 60) * 60, 23 * 60));
    setDialog({
      mode: "create",
      defaults: { date: toDateKey(target), from: minutesToTime(from), to: minutesToTime(endMinutes ?? from + 60), timeZone },
    });
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

  const events = schedules.flatMap((schedule) => toEvents(schedule, timeZone));

  const onSaved = (schedule: Schedule, created: boolean) => {
    setDialog(null);
    snackbar.success(created ? "Schedule created." : "Schedule saved.");
    // Show the week holding the saved schedule.
    const day = zonedTime(new Date(schedule.start), timeZone).day;
    if (!weekDays(date).some((d) => isSameDay(d, day))) go(day);
    reload();
  };

  /**
   * A schedule dragged in the grid: work out its new exact times (moves are wall-clock days and
   * minutes in the chosen zone, so daylight-saving changes don't shift it), show them right away,
   * then save. If saving fails, reloading puts it back.
   */
  const onEventChange = async (id: string, change: EventChange) => {
    const schedule = schedules.find((s) => s.id === id);
    if (!schedule) return;
    const start = new Date(schedule.start);
    const end = new Date(schedule.end);
    let newStart = start;
    let newEnd: Date;
    if (change.mode === "move") {
      const from = zonedTime(start, timeZone);
      const minutes = from.minutes + change.minutes;
      const day = addDays(from.day, change.days + Math.floor(minutes / 1440));
      newStart = zonedToUtc(toDateKey(day), minutesToTime(((minutes % 1440) + 1440) % 1440), timeZone);
      newEnd = new Date(newStart.getTime() + (end.getTime() - start.getTime()));
    } else {
      newEnd = new Date(Math.max(end.getTime() + change.minutes * 60_000, start.getTime() + 15 * 60_000));
    }
    patch(id, { start: newStart.toISOString(), end: newEnd.toISOString() });
    const result = await reschedule(id, newStart.toISOString(), newEnd.toISOString());
    if (result.ok) {
      snackbar.success(`"${schedule.title}" is now ${formatShortDate(newStart, timeZone)}, ${formatTimeRange(newStart, newEnd, timeZone)}.`);
    } else {
      snackbar.error(result.message);
    }
    reload();
  };

  /** The form's values for editing a schedule, in the zone it was entered in. */
  const editDefaults = (schedule: Schedule): ScheduleFormDefaults & { timeZone: string } => {
    const zone = schedule.timeZone ?? timeZone;
    const start = zonedTime(new Date(schedule.start), zone);
    const end = zonedTime(new Date(schedule.end), zone);
    return {
      timeZone: zone,
      title: schedule.title,
      date: toDateKey(start.day),
      from: minutesToTime(start.minutes),
      // A schedule crossing midnight there (only older ones, saved without a zone) is cut at the day's end.
      to: minutesToTime(isSameDay(start.day, end.day) ? end.minutes : 23 * 60 + 59),
      clientCompany: schedule.clientCompany,
      interviewer: schedule.interviewer,
      meetingUrl: schedule.meetingUrl ?? "",
      resumeUrl: schedule.resumeUrl,
      jobDescriptionUrl: schedule.jobDescriptionUrl,
      screenShareRequired: schedule.screenShareRequired ? "on" : "",
      linkedUids: schedule.linkedUids,
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
        onCreate={manage ? () => create() : undefined}
        timeZone={timeZoneSetting}
        onTimeZoneChange={setTimeZoneSetting}
        extra={
          mode === "view" && viewedGroup ? (
            <PsSelect
              aria-label="Group"
              value={viewedGroup.id}
              onChange={(e) => setParams({ [GROUP_PARAM]: e.target.value })}
              className="h-8 max-w-40 rounded-full py-0 pl-3 text-xs sm:max-w-56"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </PsSelect>
          ) : null
        }
      />
      <PsCalendarTimeGrid
        days={weekDays(date)}
        today={zoned.day}
        nowMinutes={zoned.minutes}
        zoneLabel={zoned.label}
        events={events}
        editable={manage}
        onEventChange={onEventChange}
        onEventClick={(id) => {
          const schedule = schedules.find((s) => s.id === id);
          if (schedule) setDialog({ mode: "view", schedule, back: [] });
        }}
        onSlotSelect={(day, start, end) => create(day, start, end)}
      />

      {/* Phones: Create floats at the bottom right, like Google Calendar. */}
      {manage && (
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
      )}

      {dialog?.mode === "view" && (
        <PsDialog title={dialog.schedule.title} onClose={() => setDialog(null)}>
          <PsScheduleDetails
            key={dialog.schedule.id}
            schedule={dialog.schedule}
            mode={mode}
            timeZone={timeZone}
            onCallerSaved={(schedule) => {
              setDialog({ ...dialog, schedule });
              reload();
            }}
            // A linked schedule may be in another week, so it's loaded by its ID.
            onOpenLinked={async (uid) => {
              const res = await fetch(`${SCHEDULES_API_PATH}/${uid}${groupQuery ? `?${groupQuery}` : ""}`, { cache: "no-store" }).catch(() => null);
              if (!res?.ok) return res?.status === 404 ? "That schedule no longer exists." : "Couldn't open that schedule. Try again.";
              const { schedule } = (await res.json()) as { schedule: Schedule };
              setDialog({ mode: "view", schedule, back: [...dialog.back, dialog.schedule] });
              return null;
            }}
            backTitle={dialog.back.at(-1)?.title}
            onBack={
              dialog.back.length
                ? () => setDialog({ mode: "view", schedule: dialog.back.at(-1)!, back: dialog.back.slice(0, -1) })
                : undefined
            }
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
