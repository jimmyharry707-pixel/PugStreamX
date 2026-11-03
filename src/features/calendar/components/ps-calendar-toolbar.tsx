"use client";

import type { ReactNode } from "react";
import { PsButton } from "@/components/ui/ps-button";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { weekTitle } from "../dates";
import { PsCalendarDatePicker } from "./ps-calendar-date-picker";
import { PsTimeZoneSelect } from "./ps-time-zone-select";

const chevron = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
    <path d={d} />
  </svg>
);

/**
 * Calendar header: Today, previous / next week, the week's title (which opens a month calendar
 * popup for jumping to another week), Create (when `onCreate` is given), `extra` controls (e.g.
 * a group picker) and the time zone picker.
 */
export function PsCalendarToolbar({
  date,
  today,
  onGo,
  onCreate,
  timeZone,
  onTimeZoneChange,
  extra,
}: {
  /** Only for people who may create schedules. */
  onCreate?: () => void;
  extra?: ReactNode;
  date: Date;
  today: Date | null;
  /** Show the week holding this date; null for this week. */
  onGo: (date: Date | null) => void;
  /** The chosen time zone; "" for the device's. */
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
}) {
  const step = (days: number) => onGo(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));

  return (
    // `relative`: on phones the date picker popup is placed against the toolbar.
    <div className="relative flex items-center gap-1.5 border-b border-white/10 px-4 py-3 sm:gap-3 lg:px-6">
      <PsButton variant="secondary" size="sm" onClick={() => onGo(null)} title="Today (T)" className="px-3 py-1.5 sm:px-4">
        Today
      </PsButton>
      <div className="flex items-center">
        <PsIconButton label="Previous week (K)" onClick={() => step(-7)} className="size-7 rounded-full text-gray-300 sm:size-8">
          {chevron("m15 6-6 6 6 6")}
        </PsIconButton>
        <PsIconButton label="Next week (J)" onClick={() => step(7)} className="size-7 rounded-full text-gray-300 sm:size-8">
          {chevron("m9 6 6 6-6 6")}
        </PsIconButton>
      </div>
      <PsCalendarDatePicker
        title={weekTitle(date)}
        shortTitle={weekTitle(date, { short: true })}
        selected={date}
        today={today}
        onSelect={onGo}
      />
      {/* Phones use the floating button in PsCalendar instead. */}
      {onCreate && (
        <PsButton size="sm" onClick={onCreate} title="Create (C)" className="gap-1.5 py-1.5 pl-3 pr-4 max-sm:hidden">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" className="size-4" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create
        </PsButton>
      )}
      {extra}
      <PsTimeZoneSelect value={timeZone} onChange={onTimeZoneChange} />
    </div>
  );
}
