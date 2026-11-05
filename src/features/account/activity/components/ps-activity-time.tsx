"use client";

import { deviceTimeZone, useTimeZoneSetting } from "@/features/scheduling/calendar/time-zone";

/**
 * When an activity happened, in the viewer's time zone (the one chosen on the calendar, else the
 * device's). The zone is only known in the browser, so the server shows UTC.
 */
export function PsActivityTime({ at }: { at: string }) {
  const setting = useTimeZoneSetting();
  const zone = setting === null ? "UTC" : setting || deviceTimeZone();
  return (
    <time dateTime={at} className="whitespace-nowrap">
      {new Intl.DateTimeFormat("en", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(at))}
    </time>
  );
}
