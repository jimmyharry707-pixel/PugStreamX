import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function PsTextarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "block w-full min-w-0 resize-y rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-400 aria-invalid:border-red-500",
        className,
      )}
      {...props}
    />
  );
}
