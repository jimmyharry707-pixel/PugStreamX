"use client";

import { useMemo } from "react";
import { deviceTimeZone, timeZoneName, timeZoneOffset, timeZoneOptions } from "../time-zone";

/**
 * Time zone picker: a small pill showing the zone's offset ("GMT+8"; just a globe on phones),
 * with a native select over it, so the full list opens and can be searched by typing.
 * `value` "" means the device's time zone.
 */
export function PsTimeZoneSelect({ value, onChange }: { value: string; onChange: (timeZone: string) => void }) {
  const options = useMemo(() => timeZoneOptions(new Date()), []);
  const device = deviceTimeZone();
  const current = value || device;
  const now = new Date();
  const label = `${timeZoneName(current)} (${timeZoneOffset(current, now, "long")})`;

  return (
    <div className="relative shrink-0">
      {/* Invisible but clickable; the pill below shows its focus and hover. */}
      <select
        aria-label="Time zone"
        title={`Time zone: ${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0"
      >
        <option value="">Device time zone: ({timeZoneOffset(device, now, "long")}) {timeZoneName(device)}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div
        aria-hidden
        className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-gray-900 px-2 text-xs text-gray-300 transition peer-hover:bg-gray-800 peer-hover:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 sm:px-3"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
        <span className="whitespace-nowrap max-sm:hidden">{timeZoneOffset(current, now, "short")}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5 shrink-0 text-gray-500 max-sm:hidden">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </div>
    </div>
  );
}
