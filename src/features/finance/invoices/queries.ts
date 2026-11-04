import "server-only";
import { ObjectId, type Filter } from "mongodb";
import { avatarUrl } from "@/features/account/profile/constants";
import type { UserDoc } from "@/features/account/users/types";
import { getCollection } from "@/lib/db/client";
import { paginate, type Page } from "@/lib/utils/pagination";
import { INVOICE_PAGE_SIZE, INVOICE_STATUSES, PAYMENT_METHODS, type InvoiceFilter, type PaymentMethod } from "./constants";
import type { Invoice, InvoiceDoc, InvoicePerson, InvoiceTotals } from "./types";

// Invoices are per-user data, so nothing here is cached.

/** Names and photos of the given accounts, by id. Missing ids are deleted accounts. */
async function peopleOf(ids: ObjectId[]): Promise<Map<string, NonNullable<InvoicePerson>>> {
  if (ids.length === 0) return new Map();
  const users = await getCollection<UserDoc>("users");
  const docs = await users.find({ _id: { $in: ids } }, { projection: { email: 1, profile: 1 } }).toArray();
  return new Map(
    docs.map((u) => [
      u._id.toHexString(),
      {
        fullName: u.profile?.fullName ?? u.email,
        displayName: u.profile?.displayName ?? u.email,
        avatarUrl: u.profile ? avatarUrl(u.profile.avatarId.toHexString()) : null,
      },
    ]),
  );
}

/** Turns documents into browser-safe invoices, with the reviewer (and with `withMember`, who asked). */
async function toInvoices(docs: InvoiceDoc[], withMember: boolean): Promise<Invoice[]> {
  const ids = new Map<string, ObjectId>();
  for (const doc of docs) {
    if (doc.reviewedBy) ids.set(doc.reviewedBy.toHexString(), doc.reviewedBy);
    if (withMember) ids.set(doc.userId.toHexString(), doc.userId);
  }
  const people = await peopleOf([...ids.values()]);
  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    method: doc.method,
    address: doc.address,
    amountCents: doc.amountCents,
    note: doc.note,
    status: doc.status,
    reviewNote: doc.reviewNote,
    reviewedAt: doc.reviewedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    reviewer: doc.reviewedBy ? (people.get(doc.reviewedBy.toHexString()) ?? null) : null,
    ...(withMember && { member: people.get(doc.userId.toHexString()) ?? null }),
  }));
}

/** Count and sum per status for the matching invoices. */
async function totalsOf(filter: Filter<InvoiceDoc>): Promise<InvoiceTotals> {
  const invoices = await getCollection<InvoiceDoc>("invoices");
  const rows = await invoices
    .aggregate<{ _id: InvoiceDoc["status"]; count: number; amountCents: number }>([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 }, amountCents: { $sum: "$amountCents" } } },
    ])
    .toArray();
  const totals = Object.fromEntries(INVOICE_STATUSES.map((s) => [s, { count: 0, amountCents: 0 }])) as InvoiceTotals;
  for (const row of rows) if (row._id in totals) totals[row._id] = { count: row.count, amountCents: row.amountCents };
  return totals;
}

/** One page of the matching invoices, newest first. */
async function pageOf(filter: Filter<InvoiceDoc>, requestedPage: number, total: number, withMember: boolean) {
  const invoices = await getCollection<InvoiceDoc>("invoices");
  const page = paginate(requestedPage, total, INVOICE_PAGE_SIZE);
  const docs = await invoices.find(filter).sort({ createdAt: -1, _id: -1 }).skip(page.skip).limit(page.pageSize).toArray();
  return { items: await toInvoices(docs, withMember), page };
}

export type InvoicePage = { items: Invoice[]; page: Page; totals: InvoiceTotals };

/** A member's own payment history (one page) and their totals. */
export async function listMyInvoices(userId: ObjectId, requestedPage: number): Promise<InvoicePage> {
  const filter: Filter<InvoiceDoc> = { userId };
  const totals = await totalsOf(filter);
  const total = INVOICE_STATUSES.reduce((n, s) => n + totals[s].count, 0);
  return { ...(await pageOf(filter, requestedPage, total, false)), totals };
}

/** Every member's invoices for Admin › Invoices (one page), filtered by status. Callers must check requireSuperAdmin(). */
export async function listAllInvoices(status: InvoiceFilter, requestedPage: number): Promise<InvoicePage> {
  const totals = await totalsOf({});
  const filter: Filter<InvoiceDoc> = status === "all" ? {} : { status };
  const total = status === "all" ? INVOICE_STATUSES.reduce((n, s) => n + totals[s].count, 0) : totals[status].count;
  return { ...(await pageOf(filter, requestedPage, total, true)), totals };
}

/**
 * One invoice. With `ownerId`, only if it's theirs (members); without, any (super-admins only).
 */
export async function findInvoice(id: ObjectId, ownerId?: ObjectId): Promise<Invoice | null> {
  const invoices = await getCollection<InvoiceDoc>("invoices");
  const doc = await invoices.findOne(ownerId ? { _id: id, userId: ownerId } : { _id: id });
  return doc ? (await toInvoices([doc], !ownerId))[0] : null;
}

/** The address a member last used for each method, to fill the form in for them. */
export async function lastAddresses(userId: ObjectId): Promise<Partial<Record<PaymentMethod, string>>> {
  const invoices = await getCollection<InvoiceDoc>("invoices");
  const rows = await invoices
    .aggregate<{ _id: PaymentMethod; address: string }>([
      { $match: { userId, method: { $in: [...PAYMENT_METHODS] } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$method", address: { $first: "$address" } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((r) => [r._id, r.address]));
}
