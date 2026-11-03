"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { cn } from "@/lib/utils/cn";
import type { Snackbar, SnackbarType } from "../types";
import "@/static/css/components/ps-snackbar.css";

const styles: Record<SnackbarType, { container: string; icon: string; bar: string }> = {
  default: { container: "border-white/10", icon: "text-gray-300", bar: "bg-gray-400" },
  success: { container: "border-success-500/40", icon: "text-success-400", bar: "bg-success-400" },
  info: { container: "border-info-500/40", icon: "text-info-400", bar: "bg-info-400" },
  warning: { container: "border-warning-500/40", icon: "text-warning-400", bar: "bg-warning-400" },
  error: { container: "border-danger-500/40", icon: "text-danger-400", bar: "bg-danger-400" },
};

const iconPaths: Record<SnackbarType, ReactNode> = {
  default: <path d="M8 12h.01M12 12h.01M16 12h.01" />,
  success: <path d="m8 12.5 2.5 2.5L16 9.5" />,
  info: <path d="M12 8h.01M11 12h1v4h1" />,
  warning: <path d="M12 8v4.5M12 16h.01" />,
  error: <path d="m9 9 6 6m0-6-6 6" />,
};

function Icon({ type }: { type: SnackbarType }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      {iconPaths[type]}
    </svg>
  );
}

/** One snackbar. Closes itself after `duration`; hovering or focusing pauses the countdown. */
export function PsSnackbar({ snackbar, onDismiss }: { snackbar: Snackbar; onDismiss: (id: string) => void }) {
  const { id, type, title, message, duration } = snackbar;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const timed = Number.isFinite(duration);

  useEffect(() => {
    if (paused || !timed) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, timed, id, onDismiss]);

  const style = styles[type];
  // Errors and warnings interrupt screen readers; the rest are announced politely.
  const urgent = type === "error" || type === "warning";

  return (
    <div
      role={urgent ? "alert" : "status"}
      aria-atomic
      data-paused={paused || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "ps-snackbar pointer-events-auto relative overflow-hidden rounded-xl border bg-gray-900/95 shadow-lg shadow-black/40 backdrop-blur",
        style.container,
      )}
    >
      <div className="flex items-start gap-3 py-3 pl-4 pr-2">
        <span className={cn("mt-0.5 shrink-0", style.icon)}>
          <Icon type={type} />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          {title && <p className="font-semibold text-gray-100">{title}</p>}
          <p className="break-words text-gray-300">{message}</p>
        </div>
        <PsIconButton label="Dismiss notification" onClick={() => onDismiss(id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4" aria-hidden>
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </PsIconButton>
      </div>
      {timed && (
        <div
          aria-hidden
          className={cn("ps-snackbar__progress absolute inset-x-0 bottom-0 h-0.5 opacity-70", style.bar)}
          style={{ "--ps-snackbar-duration": `${duration}ms` } as CSSProperties}
        />
      )}
    </div>
  );
}
