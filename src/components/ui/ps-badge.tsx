import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "live" | "tag" | "overlay" | "success" | "warning";

const variants: Record<Variant, string> = {
  live: "rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold uppercase",
  tag: "rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300",
  overlay: "rounded bg-black/70 px-1.5 py-0.5 text-xs",
  success: "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  warning: "rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-400/30",
};

export function PsBadge({ variant = "tag", className, ...props }: ComponentProps<"span"> & { variant?: Variant }) {
  return <span className={cn(variants[variant], className)} {...props} />;
}
