"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { PsIconButton } from "./ps-icon-button";

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Centered dialog (a bottom sheet on phones) shown while it's rendered. Closes with ×, Esc or
 * a click outside, by calling `onClose`. Focus stays inside while open and returns afterwards.
 * Use PsModal for dialogs driven by the URL and `confirm()` (features/confirm) for confirmations.
 */
export function PsDialog({
  title,
  description,
  onClose,
  children,
  role = "dialog",
  initialFocus,
  layer = "dialog",
  size = "md",
}: {
  title: string;
  /** Short text under the title, read out with it by screen readers. */
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  /** "alertdialog" for confirmations that need an answer. */
  role?: "dialog" | "alertdialog";
  /** CSS selector inside the dialog to focus first (defaults to the dialog itself). */
  initialFocus?: string;
  /** "confirm" stacks above other dialogs. */
  layer?: "dialog" | "confirm";
  size?: "sm" | "md";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  // Read the latest onClose in the key handler without re-running the mount effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = initialFocus ? panelRef.current?.querySelector<HTMLElement>(initialFocus) : null;
    (target ?? panelRef.current)?.focus();
    // Keep the page behind from scrolling while the dialog is open.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [initialFocus]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onCloseRef.current();
    } else if (e.key === "Tab") {
      const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    // Layering: confirm (130) > dialogs and the mobile drawer (120) > topbar (110) > snackbars (100).
    <div className={cn("fixed inset-0 flex items-end justify-center sm:items-center sm:p-4", layer === "confirm" ? "z-[130]" : "z-[120]")}>
      <div aria-hidden className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onCloseRef.current()} />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 outline-none sm:rounded-2xl",
          size === "sm" ? "max-w-sm" : "max-w-lg",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold">{title}</h2>
            {description && <div id={descriptionId} className="mt-1 text-sm text-zinc-400">{description}</div>}
          </div>
          <PsIconButton label="Close" onClick={() => onCloseRef.current()} className="-mr-1 size-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5" aria-hidden>
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </PsIconButton>
        </div>
        {children && <div className="overflow-y-auto p-5">{children}</div>}
      </div>
    </div>
  );
}
