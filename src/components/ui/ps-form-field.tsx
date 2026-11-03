import type { ComponentProps, ReactNode } from "react";
import { PsField } from "./ps-field";
import { PsInput } from "./ps-input";
import { PsPasswordInput } from "./ps-password-input";

/** Label + input + error/hint text. Password fields get a show/hide toggle automatically. */
export function PsFormField({
  label,
  name,
  errors,
  hint,
  id = name,
  type,
  ...inputProps
}: ComponentProps<"input"> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: ReactNode;
}) {
  return (
    <PsField id={id} label={label} errors={errors} hint={hint}>
      {(control) =>
        type === "password" ? (
          <PsPasswordInput name={name} {...control} {...inputProps} />
        ) : (
          <PsInput name={name} type={type} {...control} {...inputProps} />
        )
      }
    </PsField>
  );
}
