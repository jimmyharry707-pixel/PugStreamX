import "server-only";
import path from "node:path";

/**
 * Files saved on the server's disk live under `upload/` at the project root (git-ignored).
 * Build paths with `uploadPath()` from server-generated names only, never from user input.
 */
export const UPLOAD_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "upload");

/** A path inside `upload/`. Throws if the segments would point outside it. */
export function uploadPath(...segments: string[]): string {
  const full = path.resolve(UPLOAD_DIR, ...segments);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) throw new Error("Upload path is outside upload/");
  return full;
}
