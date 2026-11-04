import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { pageItems, withPage, type Page } from "@/lib/utils/pagination";

const ITEM = "inline-flex size-8 items-center justify-center rounded-lg text-sm transition";

function Arrow({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  const icon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
      {children}
    </svg>
  );
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(ITEM, "text-gray-600")}>
        {icon}
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={cn(ITEM, "text-gray-300 hover:bg-white/5 hover:text-white")}>
      {icon}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

/**
 * Page links for any list paginated with `?page=N` (see lib/utils/pagination.ts):
 * "Showing 11–20 of 45", then ‹ 1 … 4 5 6 … 9 ›. Works from server and client components.
 *
 *   const pg = paginate(parsePage(params.page), total);
 *   <PsPagination {...pg} href="/invoices?status=pending" label="Invoice pages" />
 *
 * `href` is the list's URL without a page; other search params in it are kept. Renders nothing
 * for an empty list, and only the count when everything fits on one page.
 */
export function PsPagination({
  page,
  pageCount,
  pageSize,
  total,
  href,
  label = "Pages",
  className,
}: Pick<Page, "page" | "pageCount" | "pageSize" | "total"> & {
  href: string;
  /** Accessible name, e.g. "Invoice pages". */
  label?: string;
  className?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label={label} data-pagination className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2", className)}>
      <p className="text-xs text-gray-400">
        Showing <span className="font-medium text-gray-200">{from === to ? from : `${from}–${to}`}</span> of{" "}
        <span className="font-medium text-gray-200">{total}</span>
      </p>
      {pageCount > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <Arrow href={page > 1 ? withPage(href, page - 1) : null} label="Previous page">
              <path d="m15 6-6 6 6 6" />
            </Arrow>
          </li>
          {pageItems(page, pageCount).map((item, i) =>
            item === "gap" ? (
              <li key={`gap-${i}`} aria-hidden className={cn(ITEM, "w-5 text-gray-500")}>
                …
              </li>
            ) : (
              <li key={item}>
                <Link
                  href={withPage(href, item)}
                  scroll={false}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={cn(
                    ITEM,
                    "tabular-nums",
                    item === page ? "bg-brand-400 font-semibold text-gray-950" : "text-gray-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item}
                </Link>
              </li>
            ),
          )}
          <li>
            <Arrow href={page < pageCount ? withPage(href, page + 1) : null} label="Next page">
              <path d="m9 6 6 6-6 6" />
            </Arrow>
          </li>
        </ul>
      )}
    </nav>
  );
}
