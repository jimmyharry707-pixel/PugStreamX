import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Small square button holding only an icon. `label` is required: it becomes the accessible
 * name (aria-label) and the hover tooltip, since there's no visible text.
 */
export function PsIconButton({
  label,
  className,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md p-1 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-amber-400 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
