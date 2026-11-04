// Page maths for any paginated list (`?page=N`, 1-based). Pure: safe on the server and in the browser.
// Render the controls with PsPagination (components/ui/ps-pagination.tsx).

/** Rows per page when a list doesn't choose its own. */
export const PAGE_SIZE = 10;

/** The `?page=` value as a page number (1 when missing or not a positive whole number). */
export function parsePage(value: string | string[] | undefined | null): number {
  const text = Array.isArray(value) ? value[0] : value;
  if (!text || !/^\d{1,6}$/.test(text)) return 1;
  return Math.max(1, Number(text));
}

export type Page = {
  /** The current page, clamped to 1…pageCount. */
  page: number;
  /** At least 1, so an empty list still has a page 1. */
  pageCount: number;
  pageSize: number;
  total: number;
  /** Rows to skip in the query. */
  skip: number;
};

/** Where `requested` lands in a list of `total` rows (past the last page → the last page). */
export function paginate(requested: number, total: number, pageSize = PAGE_SIZE): Page {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Math.floor(requested) || 1), pageCount);
  return { page, pageCount, pageSize, total, skip: (page - 1) * pageSize };
}

/**
 * The page buttons to show: at most 7, always the first and last, the current one with its
 * neighbours, and "gap" for the pages left out. E.g. page 6 of 20 → 1 … 5 6 7 … 20.
 */
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", pageCount];
  if (page >= pageCount - 3) return [1, "gap", ...Array.from({ length: 5 }, (_, i) => pageCount - 4 + i)];
  return [1, "gap", page - 1, page, page + 1, "gap", pageCount];
}

/** `href` with `?page=N` set (page 1 drops it), keeping the other search params. */
export function withPage(href: string, page: number): string {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const next = params.toString();
  return next ? `${path}?${next}` : path;
}
