/** State returned to forms through useActionState. */
export type FormState<Field extends string = string> =
  | {
      /** Errors per field, plus `form` for errors that aren't about one field. */
      errors?: Partial<Record<Field | "form", string[]>>;
      /** Submitted values to refill the form. Never includes passwords or files. */
      values?: Partial<Record<Field, string>>;
    }
  | undefined;

/** Echoes submitted text values back to the form, minus anything secret, files and React internals. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.toLowerCase().includes("password") && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return values;
}
