"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Browsers run a timer at once if it's longer than this (about 24.8 days), so long waits are chained.
const MAX_TIMEOUT = 2 ** 31 - 1;

/**
 * Whether `at` (an ISO time) has been reached. It switches at that exact moment, like the server's
 * checks, not on a minute tick. False while rendering on the server.
 */
export function useReached(at: string): boolean {
  const time = new Date(at).getTime();
  const subscribe = useCallback(
    (onChange: () => void) => {
      let id: ReturnType<typeof setTimeout> | undefined;
      const arm = () => {
        const wait = time - Date.now();
        if (wait <= 0) onChange();
        else id = setTimeout(arm, Math.min(wait, MAX_TIMEOUT));
      };
      arm();
      return () => clearTimeout(id);
    },
    [time],
  );
  return useSyncExternalStore(subscribe, () => Date.now() >= time, () => false);
}

/** Whether the interview has started (`start`), like the server's check in `saveCallerFields`. */
export const useStarted = (start: string) => useReached(start);

/** Whether the schedule has passed (its `end`): its Profile Manager can no longer change it. */
export const usePassed = (end: string) => useReached(end);

/**
 * For many times at once (e.g. every schedule's `end` in the week): the latest of `times` (ms)
 * already reached, or -Infinity. Re-renders at the exact moment each one is reached, like
 * `useReached`, so `t <= reached` is "t has been reached". -Infinity while rendering on the server.
 */
export function useLatestReached(times: number[]): number {
  const key = [...new Set(times)].sort((a, b) => a - b).join(",");
  const sorted = useMemo(() => (key ? key.split(",").map(Number) : []), [key]);
  const subscribe = useCallback(
    (onChange: () => void) => {
      let id: ReturnType<typeof setTimeout> | undefined;
      const arm = () => {
        const next = sorted.find((t) => t > Date.now());
        if (next === undefined) return;
        id = setTimeout(() => {
          onChange();
          arm();
        }, Math.min(next - Date.now(), MAX_TIMEOUT));
      };
      arm();
      return () => clearTimeout(id);
    },
    [sorted],
  );
  const snapshot = () => {
    const now = Date.now();
    return sorted.findLast((t) => t <= now) ?? -Infinity;
  };
  return useSyncExternalStore(subscribe, snapshot, () => -Infinity);
}
