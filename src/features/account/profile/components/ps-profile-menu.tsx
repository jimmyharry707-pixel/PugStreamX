"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { PsAvatar } from "@/components/ui/ps-avatar";
import { signOut } from "@/features/account/auth/actions";
import { PROFILE_PATH } from "../constants";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-200 outline-none transition hover:bg-white/10 focus-visible:bg-white/10";

/**
 * Topbar profile badge. Clicking it opens a menu with "Update profile" and "Sign out".
 * Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Esc closes and returns focus, Tab closes.
 */
export function PsProfileMenu({
  displayName,
  fullName,
  email,
  avatarUrl,
}: {
  displayName: string;
  fullName: string;
  email: string;
  avatarUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

  // On open, focus the first item; close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close({ returnFocus }: { returnFocus: boolean }) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function onMenuKeyDown(e: KeyboardEvent) {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      list[(moves[e.key] + list.length) % list.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close({ returnFocus: true });
    } else if (e.key === "Tab") {
      close({ returnFocus: false });
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-gray-900 py-1 pl-1 pr-2.5 transition hover:border-white/20 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-brand-400 aria-expanded:border-brand-400/50"
      >
        <PsAvatar name={displayName} src={avatarUrl} />
        <span className="hidden max-w-40 truncate text-sm font-medium text-gray-200 sm:block">{displayName}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4 text-gray-400" aria-hidden>
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/10 bg-gray-900 p-1.5 shadow-2xl shadow-black/50"
        >
          <div className="mb-1 flex items-center gap-3 border-b border-white/10 px-3 pb-3 pt-2">
            <PsAvatar name={displayName} src={avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-100">{fullName}</p>
              <p className="truncate text-xs text-gray-400">{email}</p>
            </div>
          </div>
          <Link role="menuitem" href={PROFILE_PATH} className={itemClass} onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="size-4 text-gray-400" aria-hidden>
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 19.5a7 7 0 0 1 14 0" />
            </svg>
            Update profile
          </Link>
          <form action={signOut}>
            <button role="menuitem" type="submit" className={itemClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-gray-400" aria-hidden>
                <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h10" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
