import "server-only";
import { WORK_FILE_EXTENSION, WORK_FILE_MAX_BYTES, formatBytes } from "./constants";

/** How much of the start of a file is checked for HTML markers. */
const SNIFF_BYTES = 64 * 1024;

/** A display name for an uploaded file: no folders or control characters, at most 200 characters. */
export function cleanFileName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
  return clean || "untitled.html";
}

/**
 * Checks one uploaded file by its name and its real bytes: an `.html` file, not empty, not too
 * large, text (no NUL bytes) that starts with a tag and has `<html` or `<!doctype html` near the
 * top. Returns the problem, or null when it's fine.
 */
export function checkHtmlFile(name: string, bytes: Uint8Array): string | null {
  if (!name.toLowerCase().endsWith(WORK_FILE_EXTENSION)) return `"${name}" isn't an ${WORK_FILE_EXTENSION} file.`;
  if (bytes.length === 0) return `"${name}" is empty.`;
  if (bytes.length > WORK_FILE_MAX_BYTES) return `"${name}" is larger than ${formatBytes(WORK_FILE_MAX_BYTES)}.`;

  const head = bytes.subarray(0, SNIFF_BYTES);
  if (head.includes(0)) return `"${name}" isn't a web page (it isn't text).`;
  // latin1 maps every byte to one character, so the ASCII markers are found in any encoding
  // that keeps ASCII as is (UTF-8, Windows-1252, …).
  const text = Buffer.from(head).toString("latin1").replace(/^ï»¿/, "");
  if (!text.trimStart().startsWith("<") || !/<html[\s>]|<!doctype\s+html/i.test(text)) {
    return `"${name}" isn't a web page (no <html> found).`;
  }
  return null;
}
