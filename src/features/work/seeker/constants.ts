// Shared by the client and the server. Keep free of server-only imports.

/** Job seekers upload their work results here (left panel: Seeker). */
export const SEEKER_PATH = "/seeker";
/** POST: upload one work result (multipart, its `.html` files under `files`). */
export const WORK_RESULTS_API = "/api/work-results";

/** Opens one uploaded page in the browser (sandboxed), by its work result and position. */
export const workFileUrl = (resultId: string, index: number) => `${WORK_RESULTS_API}/${resultId}/files/${index}`;

/** `?result=<id>` opens that work result's files. */
export const RESULT_PARAM = "result";

/** Work results per page in the list. */
export const WORK_RESULT_PAGE_SIZE = 10;

/** Only saved web pages: each `.html` file is one bid. */
export const WORK_FILE_EXTENSION = ".html";
/** Most files in one work result. */
export const WORK_FILES_MAX = 200;
/** Largest single file. */
export const WORK_FILE_MAX_BYTES = 5 * 1024 * 1024;
/** Largest upload (all files together). */
export const WORK_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;

/** 1536 → "1.5 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** `?group=<id>` (founders only) picks a group; `none` is job seekers without a group. */
export const GROUP_FILTER_PARAM = "group";
export const NO_GROUP = "none";
/** `?seeker=<display name>` picks one job seeker (founders and Profile Managers). */
export const SEEKER_PARAM = "seeker";

export type SeekerFilters = { group?: string | null; seeker?: string | null };

/** The Seeker page URL with its filters, `?page` and `?result` when given. */
export function seekerHref({ group, seeker, page, result }: SeekerFilters & { page?: number; result?: string } = {}): string {
  const params = new URLSearchParams();
  if (group) params.set(GROUP_FILTER_PARAM, group);
  if (seeker) params.set(SEEKER_PARAM, seeker);
  if (page && page > 1) params.set("page", String(page));
  if (result) params.set(RESULT_PARAM, result);
  const query = params.toString();
  return query ? `${SEEKER_PATH}?${query}` : SEEKER_PATH;
}
