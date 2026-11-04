import type { ObjectId } from "mongodb";
import type { InvoiceStatus, PaymentMethod } from "./constants";

/** Document in `ps_invoices`: a member asking the founders for a payment. */
export type InvoiceDoc = {
  _id: ObjectId;
  /** The member who asked. Kept after their account is deleted (payment records stay). */
  userId: ObjectId;
  method: PaymentMethod;
  /** Where to pay: a BEP20 wallet, a PayPal email, a Zelle email or phone, or a Venmo "@username". */
  address: string;
  /** US dollars, in cents, so sums are exact. */
  amountCents: number;
  /** The member's note. */
  note: string;
  status: InvoiceStatus;
  /** The founder's note when accepting or rejecting; null if none. */
  reviewNote: string | null;
  /** The founder who accepted or rejected it. */
  reviewedBy: ObjectId | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type InvoiceInput = Pick<InvoiceDoc, "method" | "address" | "amountCents" | "note">;

/** A person on an invoice, safe for the browser. Null when the account is gone ("Former member"). */
export type InvoicePerson = { fullName: string; displayName: string; avatarUrl: string | null } | null;

/** An invoice for the browser. Never carries user ids. */
export type Invoice = {
  id: string;
  method: PaymentMethod;
  address: string;
  amountCents: number;
  note: string;
  status: InvoiceStatus;
  reviewNote: string | null;
  /** ISO timestamps. */
  reviewedAt: string | null;
  createdAt: string;
  /** Who asked (filled in on the admin page). */
  member?: InvoicePerson;
  /** The founder who reviewed it, once reviewed. */
  reviewer: InvoicePerson;
};

/** Sums in cents, per status. */
export type InvoiceTotals = Record<InvoiceStatus, { count: number; amountCents: number }>;
