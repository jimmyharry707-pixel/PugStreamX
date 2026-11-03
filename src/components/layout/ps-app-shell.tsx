"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PsIconButton } from "@/components/ui/ps-icon-button";
import { PsBrand } from "./ps-brand";

/**
 * Main-site frame: left panel, topbar and main container.
 * On large screens the left panel is always visible; below that it's a drawer opened from the topbar.
 */
export function PsAppShell({ sidebar, topbarEnd, children }: { sidebar: ReactNode; topbarEnd: ReactNode; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer after navigating (adjusting state during render, as React recommends).
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh">
      {/* Left panel (large screens) */}
      <aside aria-label="Sidebar" className="hidden w-64 shrink-0 border-r border-white/10 bg-zinc-950 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col overflow-y-auto">{sidebar}</div>
      </aside>

      {/* Left panel as a drawer (small screens) */}
      {drawerOpen && (
        // Layering: drawer (120) > topbar and its menus (110) > snackbars (100, see ps-snackbar-viewport) > page.
        // UI the user just opened stays on top of passing notifications.
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside
            id="ps-nav-drawer"
            aria-label="Sidebar"
            // Also close when a link to the current page is tapped (the pathname doesn't change then).
            onClick={(e) => (e.target as Element).closest("a") && setDrawerOpen(false)}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-white/10 bg-zinc-950 shadow-2xl"
          >
            <PsIconButton label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute right-3 top-4 size-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5" aria-hidden>
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </PsIconButton>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-[110] flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur lg:px-6">
          <PsIconButton
            label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls="ps-nav-drawer"
            onClick={() => setDrawerOpen(true)}
            className="size-9 lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </PsIconButton>
          <PsBrand className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2">{topbarEnd}</div>
        </header>

        {/* Main container */}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
