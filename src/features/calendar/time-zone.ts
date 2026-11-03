"use client";

import { useSyncExternalStore } from "react";

// The calendar's time zone. The user's choice is remembered in this browser (localStorage);
// "" means "follow the device". Like useNow(), it's null on the server and during hydration.

const STORAGE_KEY = "ps_time_zone";

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Used when storage is blocked (private windows, blocked site data).
let fallback = "";
const listeners = new Set<() => void>();

function read(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    return stored && isValidTimeZone(stored) ? stored : "";
  } catch {
    return fallback;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The chosen time zone, "" for the device's, or null before hydration. */
export function useTimeZoneSetting(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function setTimeZoneSetting(timeZone: string) {
  fallback = timeZone;
  try {
    if (timeZone) localStorage.setItem(STORAGE_KEY, timeZone);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
  listeners.forEach((listener) => listener());
}

const partsFormats = new Map<string, Intl.DateTimeFormat>();

/**
 * What a moment is in a time zone: the calendar day (as a local midnight Date, like every
 * date in the calendar) and the minutes since that day's midnight.
 */
export function zonedTime(time: Date, timeZone: string): { day: Date; minutes: number } {
  let format = partsFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    partsFormats.set(timeZone, format);
  }
  const parts = format.formatToParts(time);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return { day: new Date(get("year"), get("month") - 1, get("day")), minutes: get("hour") * 60 + get("minute") };
}

/** The zone's UTC offset at a moment: "GMT+8" (short) or "GMT+08:00" (long); "GMT" for UTC. */
export function timeZoneOffset(timeZone: string, at: Date, style: "short" | "long"): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: style === "short" ? "shortOffset" : "longOffset" }).formatToParts(at);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
}

/** "Asia/Ho_Chi_Minh" → "Asia/Ho Chi Minh". */
export function timeZoneName(timeZone: string): string {
  return timeZone.replaceAll("_", " ");
}

function offsetMinutes(longOffset: string): number {
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(longOffset);
  return match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
}

/** Every time zone the browser knows, labelled "(GMT+08:00) Asia/Shanghai" and sorted by offset. */
export function timeZoneOptions(at: Date): { value: string; label: string }[] {
  const zones = Intl.supportedValuesOf("timeZone");
  if (!zones.includes("UTC")) zones.push("UTC");
  return zones
    .map((zone) => {
      const offset = timeZoneOffset(zone, at, "long");
      return { value: zone, label: `(${offset}) ${timeZoneName(zone)}`, sort: offsetMinutes(offset) };
    })
    .sort((a, b) => a.sort - b.sort || a.value.localeCompare(b.value))
    .map(({ value, label }) => ({ value, label }));
}
