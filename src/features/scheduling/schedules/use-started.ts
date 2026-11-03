"use client";

import { useCallback, useSyncExternalStore } from "react";

// Browsers run a timer at once if it's longer than this (about 24.8 days), so long waits are chained.
const MAX_TIMEOUT = 2 ** 31 - 1;

/**
 * Whether the interview has started (`start`, an ISO time). It switches at that exact moment, like
 * the server's check in `saveCallerFields`, not on a minute tick. False while rendering on the server.
 */
export function useStarted(start: string): boolean {
  const time = new Date(start).getTime();
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
