import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "live" | "tag" | "overlay";

const variants: Record<Variant, string> = {
  live: "rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold uppercase",
  tag: "rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300",
  overlay: "rounded bg-black/70 px-1.5 py-0.5 text-xs",
};

export function PsBadge({ variant = "tag", className, ...props }: ComponentProps<"span"> & { variant?: Variant }) {
  return <span className={cn(variants[variant], className)} {...props} />;
}
