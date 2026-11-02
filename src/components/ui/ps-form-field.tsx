import type { ComponentProps, ReactNode } from "react";
import { PsInput } from "./ps-input";

/** Label + input + error/hint text, wired up for screen readers. */
export function PsFormField({
  label,
  name,
  errors,
  hint,
  id = name,
  ...inputProps
}: ComponentProps<"input"> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: ReactNode;
}) {
  const error = errors?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-200">
        {label}
      </label>
      <PsInput id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...inputProps} />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-400">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
