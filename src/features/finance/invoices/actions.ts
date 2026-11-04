"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import { requireCompleteProfile, requireSuperAdmin } from "@/features/account/auth/dal";
import { formValues, type FormState } from "@/lib/utils/form";
import type { InvoiceField, ReviewField } from "./constants";
import { createInvoice, reviewInvoice } from "./mutations";
import { findInvoice } from "./queries";
import { invoiceSchema, reviewSchema } from "./validation";

export type InvoiceFormState = (NonNullable<FormState<InvoiceField>> & { sentAt?: number }) | undefined;

/** A member asks the founders for a payment. Founders review invoices instead of sending them. */
export async function requestPayment(_prev: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const user = await requireCompleteProfile();
  if (user.isSuperAdmin) return { errors: { form: ["Founders review invoices in Admin › Invoices."] }, values: formValues(formData) };

  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };

  await createInvoice(new ObjectId(user.id), parsed.data);
  // Show it at the top of the history.
  refresh();
  return { sentAt: Date.now() };
}

export type ReviewFormState = (NonNullable<FormState<ReviewField>> & { message?: string }) | undefined;

/** A founder accepts or rejects a pending invoice, with an optional note (required to reject). */
export async function reviewPayment(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const admin = await requireSuperAdmin();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values: formValues(formData) };

  const { invoiceId, decision, reviewNote } = parsed.data;
  const ok = await reviewInvoice(new ObjectId(invoiceId), new ObjectId(admin.id), decision, reviewNote);
  if (!ok) {
    const current = await findInvoice(new ObjectId(invoiceId));
    return { errors: { form: [current ? "This invoice has already been reviewed." : "This invoice no longer exists."] }, values: formValues(formData) };
  }
  refresh();
  return { message: decision === "accept" ? "Invoice accepted." : "Invoice rejected." };
}
