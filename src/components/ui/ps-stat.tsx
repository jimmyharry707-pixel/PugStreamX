import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "default" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  default: "text-gray-100",
  success: "text-success-300",
  warning: "text-warning-300",
  danger: "text-danger-300",
};

/** A small summary tile: a label, a big value and an optional line under it. */
export function PsStat({ label, value, detail, tone = "default", className }: { label: string; value: ReactNode; detail?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-white/10 bg-gray-900 px-4 py-3", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={cn("mt-1 truncate text-xl font-semibold tabular-nums", TONES[tone])}>{value}</p>
      {detail && <p className="mt-0.5 truncate text-xs text-gray-400">{detail}</p>}
    </div>
  );
}
