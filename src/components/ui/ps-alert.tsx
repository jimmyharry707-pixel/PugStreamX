import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "error" | "info" | "success";

const variants: Record<Variant, string> = {
  error: "border-danger-500/40 bg-danger-500/10 text-danger-300",
  info: "border-info-500/40 bg-info-500/10 text-info-300",
  success: "border-success-500/40 bg-success-500/10 text-success-300",
};

export function PsAlert({ variant = "error", children }: { variant?: Variant; children: ReactNode }) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("rounded-lg border px-3 py-2 text-sm", variants[variant])}>
      {children}
    </div>
  );
}
