"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Left-panel button that opens a popup menu of links above it (e.g. Admin > Users).
 * Highlighted while one of its pages is open. Keyboard: Enter/Space/↑ opens,
 * ↑/↓/Home/End move, Esc closes and returns focus, Tab closes.
 */
export function PsSidebarMenu({
  label,
  icon,
  basePath,
  items,
}: {
  label: string;
  icon: ReactNode;
  /** Pages under this path belong to the menu (highlights its button). */
  basePath: string;
  items: readonly { label: string; href: string }[];
}) {
  const pathname = usePathname();
  const inMenu = pathname === basePath || pathname.startsWith(`${basePath}/`);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close after navigating (adjusting state during render, as React recommends).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // On open, focus the current page's item (or the first); close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    (menu?.querySelector<HTMLElement>('[aria-current="page"]') ?? menu?.querySelector<HTMLElement>('[role="menuitem"]'))?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onMenuKeyDown(e: KeyboardEvent) {
    const list = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const index = list.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      list[(moves[e.key] + list.length) % list.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
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
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-amber-400",
          inMenu ? "bg-amber-400/10 font-medium text-amber-300" : "text-zinc-300 hover:bg-white/5 hover:text-white",
          open && !inMenu && "bg-white/5 text-white",
        )}
      >
        {icon}
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className={cn("ml-auto size-4 text-zinc-500 transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path d="m7 14 5-5 5 5" />
        </svg>
      </button>

      {open && (
        // Opens upwards: the button sits at the bottom of the left panel.
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl shadow-black/60"
        >
          <p className="px-3 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                role="menuitem"
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-sm outline-none transition focus-visible:bg-white/10",
                  active ? "font-medium text-amber-300" : "text-zinc-200 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
