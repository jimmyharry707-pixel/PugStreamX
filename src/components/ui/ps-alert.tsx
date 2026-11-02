import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "error" | "info";

const variants: Record<Variant, string> = {
  error: "border-red-500/40 bg-red-500/10 text-red-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

export function PsAlert({ variant = "error", children }: { variant?: Variant; children: ReactNode }) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("rounded-lg border px-3 py-2 text-sm", variants[variant])}>
      {children}
    </div>
  );
}
