"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PsInput } from "@/components/ui/ps-input";
import { cn } from "@/lib/utils/cn";
import { deviceTimeZone, timeZoneName, timeZoneOffset, timeZoneOptions } from "../time-zone";

/** One row of the list; `hint` is a second, smaller line. */
type Item = { value: string; name: string; hint?: string; offset: string };

/**
 * Time zone picker that opens a popup with a search box and the list of zones. Type a city,
 * region or offset ("shang", "+8"); arrows move, Enter picks, Esc closes.
 *
 * - `variant="pill"` (toolbar): a small pill showing the offset ("GMT+8"; a globe on phones).
 *   Offers "Device time zone", whose `value` is "".
 * - `variant="field"` (forms, inside PsField): looks like an input, shows the full zone and
 *   submits it as `name`. Always a real zone; no "Device" option.
 */
export function PsTimeZoneSelect({
  value,
  onChange,
  variant = "pill",
  name,
  ...control
}: {
  value: string;
  onChange: (timeZone: string) => void;
  variant?: "pill" | "field";
  /** Form field name (field variant). */
  name?: string;
  /** From PsField. */
  id?: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}) {
  const field = variant === "field";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const now = new Date();
  const device = deviceTimeZone();
  const current = value || device;
  const zones = useMemo(() => timeZoneOptions(new Date()), []);

  // "Device time zone" first (pill only, while it matches the search), then the matching zones.
  const items = useMemo((): Item[] => {
    const q = query.trim().toLowerCase();
    const matches = q ? zones.filter((z) => z.search.includes(q)) : zones;
    if (field) return matches;
    const deviceItem = { value: "", name: "Device time zone", hint: timeZoneName(device), offset: timeZoneOffset(device, new Date(), "long") };
    const deviceMatches = !q || "device".includes(q) || zones.find((z) => z.value === device)?.search.includes(q);
    return deviceMatches ? [deviceItem, ...matches] : matches;
  }, [zones, query, device, field]);

  const openPopup = () => {
    setQuery("");
    // Start on the current choice.
    const index = zones.findIndex((z) => z.value === value);
    setActive(field ? Math.max(0, index) : value ? index + 1 : 0);
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const pick = (timeZone: string) => {
    onChange(timeZone);
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted zone in view.
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = items.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      PageDown: Math.min(active + 8, last),
      PageUp: Math.max(active - 8, 0),
    };
    if (e.key in moves) setActive(moves[e.key]);
    else if (e.key === "Enter") {
      // Never submit a surrounding form from the search box.
      if (items[active]) pick(items[active].value);
    } else if (e.key === "Escape") {
      // Close only this popup, not a dialog it sits in.
      e.stopPropagation();
      close(true);
    } else return;
    e.preventDefault();
  };

  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const chevron = (className: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={cn("shrink-0 transition", open && "rotate-180", className)} aria-hidden>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );

  return (
    <div ref={rootRef} className={cn("relative", field ? "w-full" : "shrink-0")}>
      {field && name && <input type="hidden" name={name} value={value} />}
      {field ? (
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? close(false) : openPopup())}
          {...control}
          className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-left text-sm outline-none transition hover:border-white/20 focus-visible:border-brand-400 aria-invalid:border-danger-500"
        >
          <span className="shrink-0 tabular-nums text-gray-400">{timeZoneOffset(current, now, "long")}</span>
          <span className="min-w-0 flex-1 truncate">{timeZoneName(current)}</span>
          {chevron("size-4 text-gray-400")}
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Time zone: ${timeZoneName(current)} (${timeZoneOffset(current, now, "long")})`}
          title={`Time zone: ${timeZoneName(current)}`}
          onClick={() => (open ? close(false) : openPopup())}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-2 text-xs text-gray-300 transition hover:bg-gray-800 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-400 sm:px-3",
            open && "bg-gray-800 text-white",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
          </svg>
          <span className="whitespace-nowrap max-sm:hidden">{timeZoneOffset(current, now, "short")}</span>
          {chevron("size-3.5 text-gray-500 max-sm:hidden")}
        </button>
      )}

      {open && (
        // Layering: above snackbars (100), level with the topbar menus (110).
        <div
          role="dialog"
          aria-label="Choose a time zone"
          className={cn(
            "absolute top-full z-[110] mt-2 flex flex-col rounded-2xl border border-white/10 bg-gray-900 shadow-2xl",
            field ? "inset-x-0 shadow-black/60" : "right-0 w-80 max-w-[calc(100vw-2rem)]",
          )}
        >
          <div className="border-b border-white/10 p-3">
            <PsInput
              autoFocus
              type="search"
              role="combobox"
              aria-label="Search time zones"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={items[active] ? optionId(active) : undefined}
              placeholder="Search city, region or offset"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label="Time zones" className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
            {items.map((item, index) => {
              const selected = item.value === value;
              return (
                <li
                  key={item.value || "device"}
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => pick(item.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm",
                    index === active ? "bg-white/10 text-white" : "text-gray-300",
                    selected && "text-brand-300",
                  )}
                >
                  <span className="w-20 shrink-0 text-xs tabular-nums text-gray-500">{item.offset}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.name}</span>
                    {item.hint && <span className="block truncate text-xs text-gray-500">{item.hint}</span>}
                  </span>
                  {selected && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden>
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </li>
              );
            })}
            {items.length === 0 && <li className="px-2.5 py-6 text-center text-sm text-gray-500">No time zones match.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
