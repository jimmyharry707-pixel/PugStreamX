"use client";

import { PsButton } from "@/components/ui/ps-button";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { cn } from "@/lib/utils/cn";
import { CALENDAR_VIEW_KEYS, CALENDAR_VIEW_LABELS, CALENDAR_VIEWS, type CalendarView } from "../constants";

const chevron = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
    <path d={d} />
  </svg>
);

/** Calendar header: Today, previous / next, the period title and the Day / Week / Month switcher. */
export function PsCalendarToolbar({
  view,
  title,
  onToday,
  onStep,
  onView,
}: {
  view: CalendarView;
  title: string;
  onToday: () => void;
  onStep: (step: -1 | 1) => void;
  onView: (view: CalendarView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-4 py-3 lg:px-6">
      <PsButton variant="secondary" size="sm" onClick={onToday} title="Today (T)" className="px-4 py-1.5">
        Today
      </PsButton>
      <div className="flex items-center">
        <PsIconButton label={`Previous ${view} (K)`} onClick={() => onStep(-1)} className="size-8 rounded-full text-zinc-300">
          {chevron("m15 6-6 6 6 6")}
        </PsIconButton>
        <PsIconButton label={`Next ${view} (J)`} onClick={() => onStep(1)} className="size-8 rounded-full text-zinc-300">
          {chevron("m9 6 6 6-6 6")}
        </PsIconButton>
      </div>
      {/* Phones: the title gets its own line under the buttons. */}
      <h1 aria-live="polite" className="min-w-0 truncate text-lg font-semibold max-sm:order-last max-sm:basis-full sm:flex-1 sm:text-xl">
        {title}
      </h1>
      <div role="group" aria-label="Calendar view" className="ml-auto inline-flex rounded-full border border-white/10 bg-zinc-900 p-0.5">
        {CALENDAR_VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === view}
            title={`${CALENDAR_VIEW_LABELS[v]} (${CALENDAR_VIEW_KEYS[v].toUpperCase()})`}
            onClick={() => onView(v)}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition sm:px-4 sm:text-sm",
              v === view ? "bg-amber-400 font-semibold text-zinc-950" : "text-zinc-300 hover:text-white",
            )}
          >
            {CALENDAR_VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
