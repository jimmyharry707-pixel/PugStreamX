import type { ReactNode } from "react";

/** Accessibility props a control must spread so its label, error and hint are connected. */
export type PsFieldControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * Label + any control + error/hint text. `children` receives the props the control needs, e.g.
 *   <PsField id="bio" label="Bio" errors={errors}>{(p) => <PsTextarea name="bio" {...p} />}</PsField>
 */
export function PsField({
  id,
  label,
  errors,
  hint,
  children,
}: {
  id: string;
  label: string;
  errors?: string[];
  hint?: ReactNode;
  children: (control: PsFieldControlProps) => ReactNode;
}) {
  const error = errors?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-200">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-400">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
