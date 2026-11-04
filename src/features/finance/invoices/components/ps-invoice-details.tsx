import type { ReactNode } from "react";
import { PsAvatar } from "@/components/ui/ps-avatar";
import { PsCopyButton } from "@/components/ui/ps-copy-button";
import { PAYMENT_METHOD_INFO } from "../constants";
import { formatAmount } from "../format";
import type { Invoice, InvoicePerson } from "../types";
import { PsInvoiceStatusBadge } from "./ps-invoice-status-badge";
import { PsInvoiceTime } from "./ps-invoice-time";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-gray-200">{children}</dd>
    </div>
  );
}

function Person({ person }: { person: InvoicePerson }) {
  if (!person) return <span className="text-gray-500">Former member</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PsAvatar name={person.fullName} src={person.avatarUrl ?? undefined} />
      <span className="min-w-0">
        <span className="block truncate text-gray-100">{person.fullName}</span>
        <span className="block truncate text-xs text-gray-500">@{person.displayName}</span>
      </span>
    </span>
  );
}

/** Everything about one invoice: the request, and the founder's decision and note once reviewed. */
export function PsInvoiceDetails({ invoice }: { invoice: Invoice }) {
  const method = PAYMENT_METHOD_INFO[invoice.method];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p data-amount className="text-3xl font-bold tabular-nums">
          {formatAmount(invoice.amountCents)}
        </p>
        <PsInvoiceStatusBadge status={invoice.status} />
      </div>

      <dl className="divide-y divide-white/5 rounded-xl border border-white/10 bg-gray-950/40 px-4">
        {invoice.member !== undefined && (
          <Row label="Member">
            <Person person={invoice.member} />
          </Row>
        )}
        <Row label="Requested">
          <PsInvoiceTime at={invoice.createdAt} />
        </Row>
        <Row label="Method">{method.label}</Row>
        <Row label={method.addressLabel}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <code data-address className="select-all break-all font-mono text-sm text-gray-100">
              {invoice.address}
            </code>
            <PsCopyButton text={invoice.address} />
          </span>
        </Row>
        <Row label="Note">
          <span className="whitespace-pre-line">{invoice.note}</span>
        </Row>
      </dl>

      {invoice.status !== "pending" && (
        <section aria-label="Review" data-review className="rounded-xl border border-white/10 bg-gray-950/40 px-4">
          <dl className="divide-y divide-white/5">
            <Row label={invoice.status === "accepted" ? "Accepted by" : "Rejected by"}>
              <Person person={invoice.reviewer} />
            </Row>
            {invoice.reviewedAt && (
              <Row label={invoice.status === "accepted" ? "Accepted" : "Rejected"}>
                <PsInvoiceTime at={invoice.reviewedAt} />
              </Row>
            )}
            <Row label="Founder's note">
              {invoice.reviewNote ? <span className="whitespace-pre-line">{invoice.reviewNote}</span> : <span className="text-gray-500">—</span>}
            </Row>
          </dl>
        </section>
      )}
    </div>
  );
}
