// Pure time zone maths with Intl, safe on the server and in the browser.

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const partsFormats = new Map<string, Intl.DateTimeFormat>();

/** The wall-clock date and time of a moment in a time zone. */
export function zonedParts(time: Date, timeZone: string) {
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
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/**
 * What a moment is in a time zone: the calendar day (as a local midnight Date, like every
 * date in the calendar) and the minutes since that day's midnight.
 */
export function zonedTime(time: Date, timeZone: string): { day: Date; minutes: number } {
  const p = zonedParts(time, timeZone);
  return { day: new Date(p.year, p.month - 1, p.day), minutes: p.hour * 60 + p.minute };
}

/**
 * The moment when the clock in `timeZone` shows `date` ("YYYY-MM-DD") at `time` ("HH:MM").
 * In a daylight-saving gap (a time that doesn't exist) it lands just after the gap.
 */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  let utc = wanted;
  // The zone's offset can differ at the guess and at the answer (DST), so correct twice.
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(utc), timeZone);
    utc += wanted - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  }
  return new Date(utc);
}
