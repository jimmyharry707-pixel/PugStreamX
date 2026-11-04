import { ObjectId } from "mongodb";
import type { Metadata } from "next";
import { PsAlert } from "@/components/ui/ps-alert";
import { PsLinkButton } from "@/components/ui/ps-button";
import { PsModal } from "@/components/ui/ps-modal";
import { PsPagination } from "@/components/ui/ps-pagination";
import { PsStat } from "@/components/ui/ps-stat";
import { requireCompleteProfile } from "@/features/account/auth/dal";
import { PsInvoiceDetails } from "@/features/finance/invoices/components/ps-invoice-details";
import { PsInvoiceForm } from "@/features/finance/invoices/components/ps-invoice-form";
import { PsInvoiceTable } from "@/features/finance/invoices/components/ps-invoice-table";
import { ADMIN_INVOICES_PATH, INVOICE_PARAM, INVOICES_PATH } from "@/features/finance/invoices/constants";
import { formatAmount, invoicesHref } from "@/features/finance/invoices/format";
import { findInvoice, lastAddresses, listMyInvoices } from "@/features/finance/invoices/queries";
import { parsePage } from "@/lib/utils/pagination";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  const user = await requireCompleteProfile();
  const params = await searchParams;

  if (user.isSuperAdmin) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="mt-6 max-w-xl space-y-4">
          <PsAlert variant="info">Members send their invoices to the founders. As a founder, you review them in Admin › Invoices.</PsAlert>
          <PsLinkButton href={ADMIN_INVOICES_PATH} size="sm">
            Review invoices
          </PsLinkButton>
        </div>
      </div>
    );
  }

  const me = new ObjectId(user.id);
  const selectedId = typeof params[INVOICE_PARAM] === "string" && ObjectId.isValid(params[INVOICE_PARAM]) ? params[INVOICE_PARAM] : null;
  const [{ items, page, totals }, addresses, selected] = await Promise.all([
    listMyInvoices(me, parsePage(params.page)),
    lastAddresses(me),
    // Only their own invoices open.
    selectedId ? findInvoice(new ObjectId(selectedId), me) : null,
  ]);
  const listHref = invoicesHref(INVOICES_PATH, { page: page.page });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="mt-1 text-sm text-gray-400">
          Ask the founders for a payment. They&apos;ll accept it (or say why not) and you&apos;ll see their answer in your
          payment history below.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PsStat label="Pending" tone="warning" value={formatAmount(totals.pending.amountCents)} detail={`${totals.pending.count} waiting for review`} />
        <PsStat label="Accepted" tone="success" value={formatAmount(totals.accepted.amountCents)} detail={`${totals.accepted.count} accepted`} />
      </div>

      <section aria-labelledby="request-heading" className="rounded-2xl border border-white/10 bg-gray-900 p-4 sm:p-6">
        <h2 id="request-heading" className="text-lg font-semibold">
          Request a payment
        </h2>
        <p className="mb-5 mt-1 text-sm text-gray-400">Choose how you want to be paid, where to, how much, and what it&apos;s for.</p>
        <PsInvoiceForm lastAddresses={addresses} />
      </section>

      <section aria-labelledby="history-heading" className="space-y-4">
        <h2 id="history-heading" className="text-lg font-semibold">
          Payment history
        </h2>
        {items.length > 0 ? (
          <>
            <PsInvoiceTable invoices={items} detailsHref={(id) => invoicesHref(INVOICES_PATH, { page: page.page, invoice: id })} />
            <PsPagination {...page} href={INVOICES_PATH} label="Payment history pages" />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-gray-400">
            No invoices yet. Your requests and the founders&apos; answers will show here.
          </p>
        )}
      </section>

      {selected && (
        <PsModal title="Invoice" closeHref={listHref}>
          <PsInvoiceDetails invoice={selected} />
        </PsModal>
      )}
    </div>
  );
}
