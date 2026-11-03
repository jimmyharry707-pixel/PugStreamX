import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "live" | "tag" | "overlay" | "success" | "warning" | "danger";

const variants: Record<Variant, string> = {
  live: "rounded bg-danger-600 px-1.5 py-0.5 text-xs font-bold uppercase",
  tag: "rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-300",
  overlay: "rounded bg-black/70 px-1.5 py-0.5 text-xs",
  success: "rounded-full bg-success-500/10 px-2.5 py-0.5 text-xs font-medium text-success-300 ring-1 ring-inset ring-success-500/30",
  warning: "rounded-full bg-warning-400/10 px-2.5 py-0.5 text-xs font-medium text-warning-300 ring-1 ring-inset ring-warning-400/30",
  danger: "rounded-full bg-danger-500/10 px-2.5 py-0.5 text-xs font-medium text-danger-300 ring-1 ring-inset ring-danger-500/30",
};

export function PsBadge({ variant = "tag", className, ...props }: ComponentProps<"span"> & { variant?: Variant }) {
  return <span className={cn(variants[variant], className)} {...props} />;
}
