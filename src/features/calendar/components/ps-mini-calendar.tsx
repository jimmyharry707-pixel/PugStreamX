"use client";

import { useState } from "react";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { cn } from "@/lib/utils/cn";
import {
  addMonths,
  calendarTitle,
  formatFullDate,
  formatWeekdayNarrow,
  isSameDay,
  isSameMonth,
  monthWeeks,
  startOfMonth,
  toDateKey,
} from "../dates";

const chevron = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
    <path d={d} />
  </svg>
);

/**
 * Small month calendar for jumping to a date. Its arrows browse months on their own; it goes
 * back to the selected date's month whenever that changes.
 */
export function PsMiniCalendar({
  selected,
  today,
  onSelect,
}: {
  selected: Date;
  today: Date | null;
  onSelect: (day: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(selected));

  // Follow the selected date (adjusting state during render, as React recommends).
  const selectedKey = toDateKey(selected);
  const [lastSelectedKey, setLastSelectedKey] = useState(selectedKey);
  if (selectedKey !== lastSelectedKey) {
    setLastSelectedKey(selectedKey);
    setMonth(startOfMonth(selected));
  }

  const weeks = monthWeeks(month, { fixed: true });

  return (
    <div>
      <div className="flex items-center gap-1">
        <p className="flex-1 truncate pl-1 text-sm font-medium text-zinc-200">{calendarTitle("month", month)}</p>
        <PsIconButton label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="size-7 rounded-full">
          {chevron("m15 6-6 6 6 6")}
        </PsIconButton>
        <PsIconButton label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="size-7 rounded-full">
          {chevron("m9 6 6 6-6 6")}
        </PsIconButton>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center">
        {weeks[0].map((day) => (
          <span key={day.getDay()} className="py-1 text-[10px] font-medium text-zinc-500" aria-hidden>
            {formatWeekdayNarrow(day)}
          </span>
        ))}
        {weeks.flat().map((day) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selected);
          return (
            <div key={day.getTime()} className="flex justify-center py-0.5">
              <button
                type="button"
                onClick={() => onSelect(day)}
                aria-label={formatFullDate(day)}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs transition",
                  isToday
                    ? "bg-amber-400 font-semibold text-zinc-950 hover:bg-amber-300"
                    : isSelected
                      ? "bg-amber-400/15 font-semibold text-amber-200"
                      : isSameMonth(day, month)
                        ? "text-zinc-300 hover:bg-white/10"
                        : "text-zinc-600 hover:bg-white/5",
                )}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
