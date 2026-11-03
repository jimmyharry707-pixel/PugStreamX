"use client";

import { useMemo, useSyncExternalStore } from "react";

// The current time, to the minute, ticking while mounted. It's null while rendering on the
// server and during hydration: only the browser knows the user's "today" (their time zone).

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

const getSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
const getServerSnapshot = () => null;

export function useNow(): Date | null {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (time === null ? null : new Date(time)), [time]);
}
