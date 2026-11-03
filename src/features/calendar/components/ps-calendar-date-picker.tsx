"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { PsMiniCalendar } from "./ps-mini-calendar";

/**
 * The calendar's title, as a button that opens a small month calendar in a popup for jumping
 * to a week. Closes on picking a date, Esc or a click outside.
 */
export function PsCalendarDatePicker({
  title,
  shortTitle,
  selected,
  today,
  onSelect,
}: {
  title: string;
  /** Shown instead of `title` on phones. */
  shortTitle: string;
  selected: Date;
  today: Date | null;
  onSelect: (day: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupId = useId();

  useEffect(() => {
    if (!open) return;
    // Start on the shown week's first day.
    popupRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    // Phones: the popup lines up with the toolbar's left edge; wider screens: under the title.
    <div ref={rootRef} className="min-w-0 flex-1 sm:relative">
      <h1 className="flex min-w-0">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popupId : undefined}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-base font-semibold sm:px-2 transition hover:bg-white/5 sm:text-xl",
            open && "bg-white/5",
          )}
        >
          <span aria-live="polite" className="truncate">
            <span className="sm:hidden">{shortTitle}</span>
            <span className="max-sm:hidden">{title}</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cn("size-4 shrink-0 text-gray-400 transition max-[359px]:hidden", open && "rotate-180")} aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </h1>
      {open && (
        // Layering: above snackbars (100), level with the topbar menus (110).
        <div
          ref={popupRef}
          id={popupId}
          role="dialog"
          aria-label="Choose a week"
          className="absolute left-4 top-full z-[110] mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-gray-900 p-4 shadow-2xl sm:left-0"
        >
          <PsMiniCalendar
            selected={selected}
            today={today}
            onSelect={(day) => {
              setOpen(false);
              onSelect(day);
              buttonRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
