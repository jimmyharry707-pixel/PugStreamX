// Display helpers for invoices. Safe in the browser.

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 123450 → "$1,234.50" */
export function formatAmount(cents: number): string {
  return usd.format(cents / 100);
}

/** "Nov 3, 2026, 3:40 PM" in `timeZone`. */
export function formatInvoiceTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

/** A list or detail URL: `base` with `?status`, `?page` and `?invoice` when given. */
export function invoicesHref(base: string, { status, page, invoice }: { status?: string; page?: number; invoice?: string } = {}): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  if (invoice) params.set("invoice", invoice);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
