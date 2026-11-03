import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Native select styled like PsInput. Put <option>s inside; use within PsField for a label. */
export function PsSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full min-w-0 appearance-none rounded-lg border border-white/10 bg-gray-800 py-2 pl-3 pr-9 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger-500",
          className,
        )}
        {...props}
      />
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden>
        <path d="m7 10 5 5 5-5" />
      </svg>
    </div>
  );
}
