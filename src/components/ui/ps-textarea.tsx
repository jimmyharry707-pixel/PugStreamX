import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function PsTextarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "block w-full min-w-0 resize-y rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-brand-400 aria-invalid:border-danger-500",
        className,
      )}
      {...props}
    />
  );
}
