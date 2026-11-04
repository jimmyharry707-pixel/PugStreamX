"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsButton } from "@/components/ui/ps-button";
import { PsField } from "@/components/ui/ps-field";
import { PsTextarea } from "@/components/ui/ps-textarea";
import { confirm } from "@/features/shared/confirm/store";
import { snackbar } from "@/features/shared/snackbar/store";
import { reviewPayment, type ReviewFormState } from "../actions";
import { NOTE_MAX } from "../constants";
import { formatAmount } from "../format";

/**
 * A founder accepts or rejects a pending invoice, with a note for the member (required to
 * reject). The decision is final, so it asks first. Once saved, the dialog closes (`closeHref`).
 */
export function PsInvoiceReviewForm({ invoiceId, amountCents, memberName, closeHref }: { invoiceId: string; amountCents: number; memberName: string; closeHref: string }) {
  const router = useRouter();
  const [state, setState] = useState<ReviewFormState>(undefined);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const decision = submitter?.value === "reject" ? "reject" : "accept";
    const formData = new FormData(e.currentTarget);
    formData.set("decision", decision);
    const amount = formatAmount(amountCents);
    const ok = await confirm(
      decision === "accept"
        ? { title: `Accept ${amount} for ${memberName}?`, message: "The member will see it as accepted, with your note. This can't be undone.", confirmLabel: "Accept invoice" }
        : { title: `Reject ${amount} for ${memberName}?`, message: "The member will see it as rejected, with your note. This can't be undone.", confirmLabel: "Reject invoice", tone: "danger" },
    );
    if (!ok) return;
    startTransition(async () => {
      // Handled here, not in an effect: once reviewed, the invoice isn't pending and this form
      // is gone from the refreshed page.
      const result = await reviewPayment(undefined, formData);
      if (result?.message) {
        snackbar.success(result.message);
        router.push(closeHref, { scroll: false });
      } else {
        setState(result);
      }
    });
  }

  return (
    // Snackbars sit under open dialogs, so errors are shown here instead.
    <form onSubmit={onSubmit} noValidate className="space-y-3 border-t border-white/10 pt-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <PsField id="reviewNote" label="Note for the member" errors={state?.errors?.reviewNote} hint="Optional when accepting, e.g. the transaction ID. Required when rejecting.">
        {(p) => <PsTextarea name="reviewNote" rows={3} maxLength={NOTE_MAX} defaultValue={state?.values?.reviewNote} {...p} />}
      </PsField>
      {state?.errors?.form && <PsAlert>{state.errors.form[0]}</PsAlert>}
      <div className="flex flex-wrap justify-end gap-2">
        <PsButton type="submit" name="decision" value="reject" variant="danger" size="sm" disabled={pending}>
          Reject
        </PsButton>
        <PsButton type="submit" name="decision" value="accept" size="sm" disabled={pending} className="min-w-28">
          {pending ? "Saving…" : "Accept"}
        </PsButton>
      </div>
    </form>
  );
}
