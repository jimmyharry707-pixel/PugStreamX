// Shared by the server (flash.ts writes it) and the browser (ps-snackbar-viewport.tsx reads it).
import { SNACKBAR_MAX } from "./constants";
import { isSnackbarType, type SnackbarOptions } from "./types";

/** Short-lived cookie that carries snackbars across a server-side redirect. Not httpOnly: the browser reads it. */
export const FLASH_COOKIE = "ps_flash";

/** Parses the cookie value, keeping only well-formed entries. */
export function parseFlashCookie(raw: string | undefined): SnackbarOptions[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter((s): s is SnackbarOptions => typeof s?.message === "string" && (s.type === undefined || isSnackbarType(s.type)))
      .map(({ message, type, title }) => ({ message, type, title: typeof title === "string" ? title : undefined }))
      .slice(-SNACKBAR_MAX);
  } catch {
    return [];
  }
}
