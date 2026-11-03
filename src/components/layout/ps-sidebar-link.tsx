"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * One link in the left panel. Highlighted while its page (or a page under it) is open. `badge`
 * is shown at its right end (e.g. an unread count).
 */
export function PsSidebarLink({ href, label, icon, badge }: { href: string; label: string; icon: ReactNode; badge?: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        active ? "bg-brand-400/10 font-medium text-brand-300" : "text-gray-300 hover:bg-white/5 hover:text-white",
      )}
    >
      {icon}
      {label}
      {badge}
    </Link>
  );
}
