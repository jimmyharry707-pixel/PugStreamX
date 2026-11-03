import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * On/off switch with a label (and optional hint). A real checkbox underneath (`role="switch"`),
 * so it submits `name=on` with a form when on and nothing when off.
 */
export function PsSwitch({
  id,
  label,
  hint,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type" | "role"> & { id: string; label: ReactNode; hint?: ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-gray-200">{label}</span>
        {hint && (
          <span id={`${id}-hint`} className="mt-0.5 block text-xs text-gray-500">
            {hint}
          </span>
        )}
      </label>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        {/* The track and thumb follow the checkbox's state. */}
        <span
          aria-hidden
          className="h-6 w-11 rounded-full bg-gray-700 transition peer-checked:bg-brand-400 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 peer-disabled:opacity-50"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
        />
      </span>
    </div>
  );
}
