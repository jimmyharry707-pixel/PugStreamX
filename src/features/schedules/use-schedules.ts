"use client";

import { useCallback, useEffect, useState } from "react";
import { SCHEDULES_API_PATH } from "./constants";
import type { Schedule } from "./types";

/**
 * The signed-in member's schedules overlapping [from, to), loaded from /api/schedules and
 * reloaded when the range changes or `reload()` is called. While a new range loads, the previous
 * schedules stay (they fall outside the new week, so nothing wrong is shown).
 */
export function useSchedules(range: { from: Date; to: Date } | null) {
  const [loaded, setLoaded] = useState<{ key: string; schedules: Schedule[] } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const key = range ? `from=${encodeURIComponent(range.from.toISOString())}&to=${encodeURIComponent(range.to.toISOString())}` : null;

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`${SCHEDULES_API_PATH}?${key}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ schedules: Schedule[] }>) : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        setLoaded({ key, schedules: data.schedules });
        setFailedKey(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedKey(key);
      });
    return () => controller.abort();
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    schedules: loaded?.schedules ?? [],
    loading: loaded?.key !== key && failedKey !== key,
    failed: failedKey !== null && failedKey === key,
    reload,
  };
}
