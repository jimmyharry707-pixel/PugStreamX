"use client";

import { deviceTimeZone, useTimeZoneSetting } from "@/features/scheduling/calendar/time-zone";
import { formatInvoiceTime } from "../format";

/**
 * A moment in the member's time zone (the one chosen on the calendar, else the device's).
 * The zone is only known in the browser, so the server and hydration show UTC.
 */
export function PsInvoiceTime({ at }: { at: string }) {
  const setting = useTimeZoneSetting();
  const zone = setting === null ? "UTC" : setting || deviceTimeZone();
  return (
    <time dateTime={at} className="whitespace-nowrap">
      {formatInvoiceTime(at, zone)}
    </time>
  );
}
