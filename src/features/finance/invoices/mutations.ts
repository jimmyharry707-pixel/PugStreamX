import "server-only";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db/client";
import type { InvoiceDoc, InvoiceInput } from "./types";

/** Saves a member's payment request as pending. */
export async function createInvoice(userId: ObjectId, input: InvoiceInput): Promise<ObjectId> {
  const invoices = await getCollection<InvoiceDoc>("invoices");
  const { insertedId } = await invoices.insertOne({
    _id: new ObjectId(),
    userId,
    ...input,
    status: "pending",
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
  });
  return insertedId;
}

/**
 * Accepts or rejects a pending invoice. A decision is final: an invoice that's already reviewed
 * isn't changed (so two founders can't overwrite each other). False if it's gone or reviewed.
 */
export async function reviewInvoice(id: ObjectId, reviewerId: ObjectId, decision: "accept" | "reject", reviewNote: string | null): Promise<boolean> {
  const invoices = await getCollection<InvoiceDoc>("invoices");
  const result = await invoices.updateOne(
    { _id: id, status: "pending" },
    { $set: { status: decision === "accept" ? "accepted" : "rejected", reviewNote, reviewedBy: reviewerId, reviewedAt: new Date() } },
  );
  return result.modifiedCount === 1;
}
