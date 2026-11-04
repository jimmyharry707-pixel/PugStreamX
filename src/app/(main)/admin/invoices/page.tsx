import { ObjectId } from "mongodb";
import type { Metadata } from "next";
import { PsChip } from "@/components/ui/ps-chip";
import { PsModal } from "@/components/ui/ps-modal";
import { PsPagination } from "@/components/ui/ps-pagination";
import { PsStat } from "@/components/ui/ps-stat";
import { requireSuperAdmin } from "@/features/account/auth/dal";
import { PsInvoiceDetails } from "@/features/finance/invoices/components/ps-invoice-details";
import { PsInvoiceReviewForm } from "@/features/finance/invoices/components/ps-invoice-review-form";
import { PsInvoiceTable } from "@/features/finance/invoices/components/ps-invoice-table";
import { ADMIN_INVOICES_PATH, INVOICE_FILTERS, INVOICE_PARAM, INVOICE_STATUSES, type InvoiceFilter } from "@/features/finance/invoices/constants";
import { formatAmount, invoicesHref } from "@/features/finance/invoices/format";
import { findInvoice, listAllInvoices } from "@/features/finance/invoices/queries";
import { parsePage } from "@/lib/utils/pagination";

export const metadata: Metadata = { title: "Invoices · Admin" };

const FILTER_LABELS: Record<InvoiceFilter, string> = { pending: "Pending", accepted: "Accepted", rejected: "Rejected", all: "All" };
const EMPTY: Record<InvoiceFilter, string> = {
  pending: "No invoices are waiting for review.",
  accepted: "No accepted invoices yet.",
  rejected: "No rejected invoices.",
  all: "No invoices yet.",
};

/** Pending is the default filter, so it's left out of the URL. */
const statusParam = (filter: InvoiceFilter) => (filter === "pending" ? undefined : filter);

export default async function AdminInvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  await requireSuperAdmin();
  const params = await searchParams;
  const filter = INVOICE_FILTERS.find((f) => f === params.status) ?? "pending";
  const selectedId = typeof params[INVOICE_PARAM] === "string" && ObjectId.isValid(params[INVOICE_PARAM]) ? params[INVOICE_PARAM] : null;

  const [{ items, page, totals }, selected] = await Promise.all([
    listAllInvoices(filter, parsePage(params.page)),
    selectedId ? findInvoice(new ObjectId(selectedId)) : null,
  ]);
  const counts: Record<InvoiceFilter, number> = {
    ...(Object.fromEntries(INVOICE_STATUSES.map((s) => [s, totals[s].count])) as Record<(typeof INVOICE_STATUSES)[number], number>),
    all: INVOICE_STATUSES.reduce((n, s) => n + totals[s].count, 0),
  };
  const status = statusParam(filter);
  const listHref = invoicesHref(ADMIN_INVOICES_PATH, { status, page: page.page });

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Invoices</h1>
      <p className="mt-1 text-sm text-gray-400">
        Payment requests from members. Click one to see where to pay, then accept or reject it with a note the member will see.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <PsStat label="Waiting for review" tone="warning" value={formatAmount(totals.pending.amountCents)} detail={`${totals.pending.count} pending`} />
        <PsStat label="Accepted" tone="success" value={formatAmount(totals.accepted.amountCents)} detail={`${totals.accepted.count} accepted`} />
      </div>

      <nav aria-label="Filter invoices" className="mt-6 flex flex-wrap gap-2">
        {INVOICE_FILTERS.map((f) => (
          <PsChip key={f} href={invoicesHref(ADMIN_INVOICES_PATH, { status: statusParam(f) })} active={f === filter} className="text-xs">
            {FILTER_LABELS[f]} · {counts[f]}
          </PsChip>
        ))}
      </nav>

      <div className="mt-4 space-y-4">
        {items.length > 0 ? (
          <>
            <PsInvoiceTable invoices={items} showMember detailsHref={(id) => invoicesHref(ADMIN_INVOICES_PATH, { status, page: page.page, invoice: id })} />
            <PsPagination {...page} href={invoicesHref(ADMIN_INVOICES_PATH, { status })} label="Invoice pages" />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-gray-400">{EMPTY[filter]}</p>
        )}
      </div>

      {selected && (
        <PsModal title="Invoice" closeHref={listHref}>
          <div className="space-y-4">
            <PsInvoiceDetails invoice={selected} />
            {selected.status === "pending" && (
              <PsInvoiceReviewForm
                invoiceId={selected.id}
                amountCents={selected.amountCents}
                memberName={selected.member?.fullName ?? "a former member"}
                closeHref={listHref}
              />
            )}
          </div>
        </PsModal>
      )}
    </div>
  );
}
