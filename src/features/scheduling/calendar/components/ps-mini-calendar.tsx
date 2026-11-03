"use client";

import { useState } from "react";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { cn } from "@/lib/utils/cn";
import {
  addMonths,
  formatFullDate,
  formatMonthYear,
  formatWeekdayNarrow,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isWeekend,
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
 * Small month calendar for jumping to a week; the shown week is highlighted and weekends are
 * rose. Its arrows browse
 * months on their own; it goes back to the selected date's month whenever that changes.
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

  const weeks = monthWeeks(month);

  return (
    <div>
      <div className="flex items-center gap-1">
        <p className="flex-1 truncate pl-1 text-sm font-medium text-gray-200">{formatMonthYear(month)}</p>
        <PsIconButton label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className="size-7 rounded-full">
          {chevron("m15 6-6 6 6 6")}
        </PsIconButton>
        <PsIconButton label="Next month" onClick={() => setMonth(addMonths(month, 1))} className="size-7 rounded-full">
          {chevron("m9 6 6 6-6 6")}
        </PsIconButton>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center">
        {weeks[0].map((day) => (
          <span key={day.getDay()} className={cn("py-1 text-[10px] font-medium", isWeekend(day) ? "text-weekend-300/80" : "text-gray-500")} aria-hidden>
            {formatWeekdayNarrow(day)}
          </span>
        ))}
      </div>
      {weeks.map((week) => {
        const shown = isSameWeek(week[0], selected);
        return (
          <div key={week[0].getTime()} className={cn("grid grid-cols-7 rounded-full py-0.5", shown && "bg-brand-400/10")}>
            {week.map((day) => {
              const isToday = isSameDay(day, today);
              const weekend = isWeekend(day);
              const inMonth = isSameMonth(day, month);
              return (
                <div key={day.getTime()} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => onSelect(day)}
                    aria-label={formatFullDate(day)}
                    aria-current={isToday ? "date" : undefined}
                    aria-pressed={shown}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs transition",
                      isToday
                        ? "bg-brand-400 font-semibold text-gray-950 hover:bg-brand-300"
                        : shown
                          ? cn("font-medium hover:bg-white/10", weekend ? "text-weekend-300" : "text-brand-200")
                          : weekend
                            ? cn("hover:bg-white/10", inMonth ? "text-weekend-300" : "text-weekend-300/35")
                            : inMonth
                              ? "text-gray-300 hover:bg-white/10"
                              : "text-gray-600 hover:bg-white/5",
                    )}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
