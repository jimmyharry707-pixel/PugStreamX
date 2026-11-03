import type { ReactNode } from "react";

export type ConfirmOptions = {
  title: string;
  /** What will happen. Plain text or simple markup. */
  message?: ReactNode;
  /** Label of the confirming button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label of the cancelling button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** "danger" makes the confirm button red, for deletes and other actions that can't be undone. */
  tone?: "default" | "danger";
};

export type ConfirmRequest = ConfirmOptions & { id: number; resolve: (confirmed: boolean) => void };
