import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Pill-shaped link for filters. `active` highlights the current selection. */
export function PsChip({ active = false, className, ...props }: ComponentProps<typeof Link> & { active?: boolean }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm transition",
        active ? "bg-amber-400 font-semibold text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
