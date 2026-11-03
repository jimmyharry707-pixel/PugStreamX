export const SNACKBAR_TYPES = ["default", "success", "info", "warning", "error"] as const;

export type SnackbarType = (typeof SNACKBAR_TYPES)[number];

export type SnackbarOptions = {
  message: string;
  type?: SnackbarType;
  /** Optional bold first line. */
  title?: string;
  /** Milliseconds before it closes. Defaults to 5000. `Infinity` keeps it open until dismissed. */
  duration?: number;
};

export type Snackbar = Required<Omit<SnackbarOptions, "title">> & Pick<SnackbarOptions, "title"> & { id: string };

export function isSnackbarType(value: unknown): value is SnackbarType {
  return typeof value === "string" && (SNACKBAR_TYPES as readonly string[]).includes(value);
}
