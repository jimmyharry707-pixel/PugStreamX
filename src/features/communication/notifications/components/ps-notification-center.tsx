"use client";

import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { PsBadge } from "@/components/ui/ps-badge";
import { PsButton } from "@/components/ui/ps-button";
import { PsDialog } from "@/components/ui/ps-dialog";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { splitLinks } from "@/features/communication/chat/format";
import { READ_AT_KEY, SHOWN_KEY, SKIP_MS, SKIP_UNTIL_KEY } from "../constants";
import type { Notification } from "../types";

// Browser storage can be blocked (private windows, blocked site data): every access is guarded.
function read(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}
function write(storage: "local" | "session", key: string, value: string) {
  try {
    (storage === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {}
}

// When the member last opened the notifications, as a tiny store so the bell's dot updates.
const listeners = new Set<() => void>();
function subscribeReadAt(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
const readAt = () => Number(read("local", READ_AT_KEY)) || 0;
function markRead() {
  write("local", READ_AT_KEY, String(Date.now()));
  listeners.forEach((l) => l());
}

const published = (n: Notification) => new Date(n.publishedAt ?? n.createdAt).getTime();
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

/**
 * Topbar bell with the founders' notifications (newest first). A dot shows when one was
 * published after the member last opened them. The popup also opens by itself once per tab
 * when the member arrives on the site, unless they ticked "Don't show for a day" in the
 * last 24 hours. Rendered in a portal: the topbar's backdrop blur would trap a fixed popup.
 */
export function PsNotificationCenter({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const [skipDay, setSkipDay] = useState(false);
  // Read time when the popup opened, so the ones that were new stay marked while it's open.
  const [seenBefore, setSeenBefore] = useState(0);
  // Null on the server and during hydration.
  const lastRead = useSyncExternalStore(subscribeReadAt, readAt, () => null);
  const unread = lastRead !== null && notifications.some((n) => published(n) > lastRead);

  function show() {
    setSeenBefore(readAt());
    setSkipDay(false);
    setOpen(true);
    markRead();
  }

  // On arrival: open by itself once per tab, unless skipped for the day.
  useEffect(() => {
    if (notifications.length === 0 || read("session", SHOWN_KEY)) return;
    if (Date.now() < (Number(read("local", SKIP_UNTIL_KEY)) || 0)) return;
    write("session", SHOWN_KEY, "1");
    // Opening a popup from browser storage, which only exists here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    show();
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    if (skipDay) write("local", SKIP_UNTIL_KEY, String(Date.now() + SKIP_MS));
    setOpen(false);
  }

  return (
    <>
      <PsIconButton label={unread ? "Notifications (new)" : "Notifications"} onClick={show} data-notification-bell className="relative size-10 rounded-full text-gray-300">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
          <path d="M6 9.5a6 6 0 0 1 12 0c0 3.6 1.2 5.6 2 6.5H4c.8-.9 2-2.9 2-6.5z" />
          <path d="M10 19.5a2 2 0 0 0 4 0" />
        </svg>
        {unread && <span data-unread aria-hidden className="absolute right-2 top-2 size-2 rounded-full bg-danger-500 ring-2 ring-gray-950" />}
      </PsIconButton>

      {open &&
        createPortal(
          <PsDialog title="Notifications" onClose={close} initialFocus="[data-notifications-close]">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} data-notification-id={n.id}>
                    <article className="rounded-xl border border-white/10 bg-gray-950/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 break-words font-semibold text-gray-100">{n.title}</h3>
                        {published(n) > seenBefore && (
                          <PsBadge variant="info" className="shrink-0">
                            New
                          </PsBadge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        <time dateTime={n.publishedAt ?? n.createdAt}>{dateFormat.format(new Date(published(n)))}</time>
                      </p>
                      {/* Plain text; links become clickable (http(s) only). */}
                      <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-300">
                        {splitLinks(n.message).map((part, i) =>
                          part.href ? (
                            <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-brand-300 underline-offset-2 hover:underline">
                              {part.text}
                            </a>
                          ) : (
                            <Fragment key={i}>{part.text}</Fragment>
                          ),
                        )}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" name="skipDay" checked={skipDay} onChange={(e) => setSkipDay(e.target.checked)} className="size-4 accent-brand-400" />
                Don&apos;t show for a day
              </label>
              <PsButton size="sm" onClick={close} data-notifications-close className="min-w-24">
                Close
              </PsButton>
            </div>
          </PsDialog>,
          document.body,
        )}
    </>
  );
}
