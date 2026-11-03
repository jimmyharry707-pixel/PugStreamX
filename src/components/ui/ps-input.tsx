import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function PsInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full min-w-0 rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-brand-400 aria-invalid:border-danger-500",
        className,
      )}
      {...props}
    />
  );
}
