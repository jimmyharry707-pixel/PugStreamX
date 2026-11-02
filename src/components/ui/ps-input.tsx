import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function PsInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full min-w-0 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-400 aria-invalid:border-red-500",
        className,
      )}
      {...props}
    />
  );
}
