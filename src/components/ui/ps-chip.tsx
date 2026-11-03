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
        active ? "bg-brand-400 font-semibold text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700",
        className,
      )}
      {...props}
    />
  );
}
