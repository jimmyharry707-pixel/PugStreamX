import { SNACKBAR_DURATION_MS, SNACKBAR_MAX } from "./constants";
import type { Snackbar, SnackbarOptions, SnackbarType } from "./types";

// A tiny client-side store, so snackbars can be shown from any client code (event handlers,
// effects, other modules) without a hook or provider. <PsSnackbarViewport> renders it.

type Listener = () => void;

let snackbars: Snackbar[] = [];
const listeners = new Set<Listener>();
let nextId = 0;
const EMPTY: Snackbar[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSnapshot = () => snackbars;
export const getServerSnapshot = () => EMPTY;

function show({ message, type = "default", title, duration = SNACKBAR_DURATION_MS }: SnackbarOptions): string {
  if (typeof window === "undefined") {
    // Module state on the server would be shared between users. Use flashSnackbar() from server code.
    console.warn("snackbar.show() was called on the server. Use flashSnackbar() in server actions instead.");
    return "";
  }
  const id = `snackbar-${++nextId}`;
  // Newest first; anything past the limit (the oldest) is dropped.
  snackbars = [{ id, message, type, title, duration }, ...snackbars].slice(0, SNACKBAR_MAX);
  emit();
  return id;
}

function dismiss(id: string) {
  snackbars = snackbars.filter((s) => s.id !== id);
  emit();
}

function clear() {
  snackbars = [];
  emit();
}

const ofType =
  (type: SnackbarType) =>
  (message: string, options?: Omit<SnackbarOptions, "message" | "type">) =>
    show({ ...options, message, type });

/**
 * Show snackbars from client code:
 *   snackbar.success("Saved")
 *   snackbar.error("Upload failed", { title: "Error", duration: 8000 })
 *   const id = snackbar.info("Working…", { duration: Infinity }); snackbar.dismiss(id);
 */
export const snackbar = {
  show,
  default: ofType("default"),
  success: ofType("success"),
  info: ofType("info"),
  warning: ofType("warning"),
  error: ofType("error"),
  dismiss,
  clear,
};
