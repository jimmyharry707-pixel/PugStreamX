// Shared by the client and the server. Keep free of server-only imports.

/** Members ask the founders for a payment here, and see their payment history. */
export const INVOICES_PATH = "/invoices";
/** Founders review invoices here (listed in the Admin menu). */
export { ADMIN_INVOICES_PATH } from "@/features/organization/admin/constants";

/** `?invoice=<id>` opens that invoice's details (both pages). */
export const INVOICE_PARAM = "invoice";

/** Rows per page in the history lists. */
export const INVOICE_PAGE_SIZE = 10;

export const PAYMENT_METHODS = ["bep20", "paypal", "zelle", "venmo"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** How each method is shown, and what its "where to pay" field asks for. */
export const PAYMENT_METHOD_INFO: Record<
  PaymentMethod,
  { label: string; short: string; addressLabel: string; placeholder: string; hint: string }
> = {
  bep20: {
    label: "Crypto (BEP20)",
    short: "BEP20",
    addressLabel: "Wallet address (BEP20)",
    placeholder: "0x…",
    hint: "A BNB Smart Chain address: 0x and 40 letters or digits. Check it carefully: crypto payments can't be reversed.",
  },
  paypal: { label: "PayPal", short: "PayPal", addressLabel: "PayPal email", placeholder: "you@example.com", hint: "The email of your PayPal account." },
  zelle: { label: "Zelle", short: "Zelle", addressLabel: "Zelle email or phone", placeholder: "you@example.com or +1 555 123 4567", hint: "The email or US phone number registered with Zelle." },
  venmo: { label: "Venmo", short: "Venmo", addressLabel: "Venmo username", placeholder: "@username", hint: "Your Venmo username (5 to 30 letters, digits, - or _)." },
};

export const INVOICE_STATUSES = ["pending", "accepted", "rejected"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };

/** `?status=` filters on Admin › Invoices; Pending (waiting for review) is the default. */
export const INVOICE_FILTERS = ["pending", "accepted", "rejected", "all"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

/** Largest amount one invoice can ask for, in US dollars. */
export const AMOUNT_MAX = 1_000_000;
export const ADDRESS_MAX = 120;
export const NOTE_MAX = 1000;

export const INVOICE_FIELDS = ["method", "address", "amount", "note"] as const;
export type InvoiceField = (typeof INVOICE_FIELDS)[number];
export const REVIEW_FIELDS = ["invoiceId", "decision", "reviewNote"] as const;
export type ReviewField = (typeof REVIEW_FIELDS)[number];
