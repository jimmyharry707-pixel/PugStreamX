// Client-only state for the global confirm dialog. Never import from server code.
import type { ConfirmOptions, ConfirmRequest } from "./types";

type Listener = () => void;

let current: ConfirmRequest | null = null;
let nextId = 1;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSnapshot = () => current;
export const getServerSnapshot = () => null;

/**
 * Asks the user to confirm, in the dialog mounted by <PsConfirmRoot />. Resolves true when
 * they confirm, false when they cancel or close it:
 *   if (await confirm({ title: "Delete user?", tone: "danger", confirmLabel: "Delete" })) { ... }
 * Asking again while a dialog is open cancels the open one.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...options, id: nextId++, resolve };
    emit();
  });
}

/** Answers the open dialog. Called by PsConfirmRoot. */
export function settle(id: number, confirmed: boolean) {
  if (current?.id !== id) return;
  current.resolve(confirmed);
  current = null;
  emit();
}
